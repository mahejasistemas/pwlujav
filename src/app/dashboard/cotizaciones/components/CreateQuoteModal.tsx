import { useState, useEffect } from "react";
import { X, Calculator, Truck, ArrowRight, Save, Package, DollarSign, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recommendVehicle, VehicleSpec, VEHICLE_SPECS } from "@/lib/vehiclesData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Tariff {
  id: string;
  origen: string;
  destino: string;
  rabon: number;
  sencillo: number;
  sencillo_sobrepeso: number;
  full: number;
  full_sobrepeso: number;
}

interface Client {
  id: string;
  name: string;
  company: string;
}

export function CreateQuoteModal({ isOpen, onClose }: CreateQuoteModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleSpec[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  
  // Form Data
  const [clientData, setClientData] = useState({
    company: "",
    origin: "",
    destination: "",
    serviceType: "Carga General",
    date: new Date().toISOString().slice(0, 10)
  });

  // Items Data (Replaces single cubicajeData)
  const [items, setItems] = useState([
    {
      description: "Carga General",
      largo: "",
      ancho: "",
      alto: "",
      peso: "", // In Tons
      cantidad: "1"
    }
  ]);

  const addItem = () => {
    setItems([...items, {
      description: "Carga General",
      largo: "",
      ancho: "",
      alto: "",
      peso: "",
      cantidad: "1"
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const [suggestedVehicle, setSuggestedVehicle] = useState<VehicleSpec | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSpec | null>(null);
  const [cpLoading, setCpLoading] = useState<{origin: boolean, destination: boolean}>({origin: false, destination: false});

  // Helper to normalize text for comparison
  const normalizeText = (text: string) => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  };

  // Handle CP Search
  const lookupCP = async (cp: string, field: 'origin' | 'destination') => {
    if (!/^\d{5}$/.test(cp)) return;

    setCpLoading(prev => ({ ...prev, [field]: true }));
    try {
      const res = await fetch(`https://api.zippopotam.us/mx/${cp}`);
      if (!res.ok) throw new Error("CP no encontrado");
      const data = await res.json();
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        const cityName = place["place name"];
        const stateName = place["state"];
        const fullLocation = `${cityName}, ${stateName}`;
        
        setClientData(prev => ({
          ...prev,
          [field]: fullLocation
        }));
        toast.success(`Ubicación encontrada: ${fullLocation}`);
      }
    } catch (error) {
      console.error("Error fetching CP:", error);
    } finally {
      setCpLoading(prev => ({ ...prev, [field]: false }));
    }
  };

  // Load Vehicles & Tariffs
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Vehicles
      try {
        const response = await fetch('/api/vehicles-neon');
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        const data = await response.json();
        
        // Helper to parse dimensions
        const parseDim = (val: any) => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const str = String(val);
          const matches = str.match(/[\d.]+/g);
          if (!matches) return 0;
          const nums = matches.map(n => parseFloat(n)).filter(n => !isNaN(n));
          return nums.length > 0 ? Math.max(...nums) : 0;
        };

        const vehicles: VehicleSpec[] = data.map((v: any) => ({
          id: v.servicio?.toLowerCase().replace(/\s+/g, '_') || 'unknown',
          name: v.servicio || 'Unknown',
          largo: parseDim(v.largo),
          ancho: parseDim(v.ancho),
          alto: parseDim(v.alto),
          pesoMax: parseFloat(v.peso_reglamentario) || 0,
          sobrepesoMax: parseFloat(v.sobrepeso) || 0,
          volumenMax: 0,
          tariffType: v.servicio?.toLowerCase().includes('rabon') ? 'rabon' : 
                      v.servicio?.toLowerCase().includes('full') ? 'full' : 'sencillo'
        }));

        // Calculate volume
        vehicles.forEach(v => {
           if (v.volumenMax === 0 && v.largo > 0 && v.ancho > 0 && v.alto > 0) {
             v.volumenMax = v.largo * v.ancho * v.alto;
           }
        });
        
        setAvailableVehicles(vehicles);
      } catch (error) {
        console.error("Error loading vehicles from Neon:", error);
        setAvailableVehicles(VEHICLE_SPECS);
      }

      // 2. Fetch Tariffs
      try {
        const response = await fetch('/api/tarifas');
        if (response.ok) {
          const data = await response.json();
          setTariffs(data);
        }
      } catch (error) {
        console.error("Error loading tariffs:", error);
      }
    };
    
    if (isOpen) {
      fetchData();
      
      // 3. Fetch Clients
      if (db) {
        const qClients = query(collection(db, "clients"), orderBy("name", "asc"));
        const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
          const clientsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Client));
          setClients(clientsData);
        });
        return () => unsubscribeClients();
      }
    }
  }, [isOpen]);

  const handleCalculate = () => {
    let totalVol = 0;
    let totalWeightTons = 0;
    let maxL = 0;
    let maxW = 0;
    let maxH = 0;

    const hasEmptyFields = items.some(item => 
      !item.largo || !item.ancho || !item.alto || !item.peso
    );

    if (hasEmptyFields) {
      toast.error("Por favor ingresa todas las dimensiones y peso para cada item");
      return;
    }

    items.forEach(item => {
      const l = parseFloat(item.largo) || 0;
      const w = parseFloat(item.ancho) || 0;
      const h = parseFloat(item.alto) || 0;
      const weight = parseFloat(item.peso) || 0;
      const qty = parseInt(item.cantidad) || 1;

      totalVol += (l * w * h) * qty;
      totalWeightTons += weight * qty;
      maxL = Math.max(maxL, l);
      maxW = Math.max(maxW, w);
      maxH = Math.max(maxH, h);
    });

    const recommendation = recommendVehicle(totalWeightTons, totalVol, maxL, maxW, maxH, availableVehicles);
    
    if (recommendation) {
      setSuggestedVehicle(recommendation);
      setSelectedVehicle(recommendation);
      
      // Calculate Price
      const tariff = tariffs.find(t => 
        normalizeText(t.origen) === normalizeText(clientData.origin) && 
        normalizeText(t.destino) === normalizeText(clientData.destination)
      );

      if (tariff) {
        let price = 0;
        const type = recommendation.tariffType || 'sencillo';
        const isOverweight = totalWeightTons > recommendation.pesoMax;

        if (type === 'rabon') {
          price = tariff.rabon;
        } else if (type === 'full') {
          price = isOverweight ? (tariff.full_sobrepeso || tariff.full) : tariff.full;
        } else { // sencillo
          price = isOverweight ? (tariff.sencillo_sobrepeso || tariff.sencillo) : tariff.sencillo;
        }
        
        setCalculatedPrice(price);
        if (price > 0) {
          toast.success(`Vehículo sugerido: ${recommendation.name} - Costo: $${price.toLocaleString()}`);
        } else {
           toast.success(`Vehículo sugerido: ${recommendation.name}`);
           toast.warning("Ruta encontrada pero sin precio definido para este vehículo");
        }
      } else {
        setCalculatedPrice(0);
        toast.success(`Vehículo sugerido: ${recommendation.name}`);
        toast.warning("No se encontró tarifa para esta ruta (Origen -> Destino)");
      }

    } else {
      setSuggestedVehicle(null);
      setCalculatedPrice(0);
      toast.error("No se encontró vehículo estándar. Se requiere validación manual.");
    }
  };

  const handleSave = async () => {
    if (!clientData.company) {
      toast.error("Faltan datos de la empresa");
      return;
    }
    
    if (!db) {
      toast.error("Error de conexión con base de datos");
      return;
    }

    setLoading(true);
    try {
      // If client doesn't exist in our list, save it to the "clients" collection
      const clientExists = clients.some(c => (c.company || c.name).toLowerCase() === clientData.company.toLowerCase());
      
      if (!clientExists) {
        try {
          await addDoc(collection(db, "clients"), {
            name: clientData.company,
            company: clientData.company,
            date: new Date().toISOString(),
            status: "en_proceso",
            quotesCount: 1,
            createdAt: new Date().toISOString()
          });
        } catch (clientError) {
          console.error("Error saving new client:", clientError);
        }
      }

      await addDoc(collection(db, "quotes"), {
        ...clientData,
        vehicleType: selectedVehicle?.name || "No asignado",
        vehicleId: selectedVehicle?.id,
        items,
        amount: calculatedPrice, // Saved calculated price
        status: "pendiente",
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
        createdAt: new Date().toISOString()
      });
      toast.success("Cotización creada exitosamente");
      onClose();
    } catch (error) {
      console.error("Error creating quote:", error);
      toast.error("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
        {/* Header - Minimalist style */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nueva Cotización</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-1">
                <div className={`h-1 w-8 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-black' : 'bg-slate-100'}`} />
                <div className={`h-1 w-8 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-black' : 'bg-slate-100'}`} />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider ml-1">Paso {step} de 2</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={`flex-1 ${step === 2 ? 'overflow-y-auto' : 'overflow-hidden'} p-8 custom-scrollbar`}>
          {step === 1 ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Sección Cliente */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Información del Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Empresa</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        list="clients-list"
                        className="h-11 px-4 rounded-xl border-slate-200 focus:border-black focus:ring-0 transition-all bg-white text-sm font-medium placeholder:text-slate-300"
                        placeholder="Ej. Walmart México"
                        value={clientData.company}
                        onChange={(e) => setClientData({...clientData, company: e.target.value})}
                      />
                      <datalist id="clients-list">
                        {clients.map(c => (
                          <option key={c.id} value={c.company || c.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Tipo de Servicio</Label>
                    <Select 
                      value={clientData.serviceType} 
                      onValueChange={(v) => setClientData({...clientData, serviceType: v})}
                    >
                      <SelectTrigger className="h-11 px-4 rounded-xl border-slate-200 focus:border-black focus:ring-0 transition-all bg-white text-sm font-medium">
                        <SelectValue placeholder="Selecciona servicio" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="Carga General" className="py-2.5">Carga General</SelectItem>
                        <SelectItem value="Carga Contenerizada" className="py-2.5">Carga Contenerizada</SelectItem>
                        <SelectItem value="Carga Mixt/Sobredimensionada" className="py-2.5">Carga Mixta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Sección Logística */}
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Detalles de Ruta</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl border border-slate-100 bg-slate-50/30">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Punto de Origen</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        list="origins-list"
                        className="h-11 px-4 rounded-xl border-slate-200 focus:border-black focus:ring-0 transition-all bg-white text-sm font-medium"
                        placeholder="Ciudad o CP..."
                        value={clientData.origin}
                        onChange={(e) => setClientData({...clientData, origin: e.target.value})}
                        onBlur={(e) => lookupCP(e.target.value, 'origin')}
                      />
                      <datalist id="origins-list">
                        {Array.from(new Set(tariffs.map(t => t.origen))).map((origen, idx) => (
                          <option key={`origin-${idx}`} value={origen} />
                        ))}
                      </datalist>
                      {cpLoading.origin && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Punto de Destino</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        list="destinations-list"
                        className="h-11 px-4 rounded-xl border-slate-200 focus:border-black focus:ring-0 transition-all bg-white text-sm font-medium"
                        placeholder="Ciudad o CP..."
                        value={clientData.destination}
                        onChange={(e) => setClientData({...clientData, destination: e.target.value})}
                        onBlur={(e) => lookupCP(e.target.value, 'destination')}
                      />
                      <datalist id="destinations-list">
                        {Array.from(new Set(tariffs.map(t => t.destino))).map((destino, idx) => (
                          <option key={`dest-${idx}`} value={destino} />
                        ))}
                      </datalist>
                      {cpLoading.destination && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="bg-black text-white px-8 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  disabled={!clientData.company || !clientData.origin || !clientData.destination}
                >
                  Continuar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {clientData.serviceType === "Carga General" ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Configuración de Carga</h3>
                    <button
                      onClick={addItem}
                      className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" /> Agregar Item
                    </button>
                  </div>

                  <div className="space-y-6">
                    {items.map((item, index) => (
                      <div key={index} className="p-6 rounded-2xl border border-slate-100 bg-white space-y-6 relative group">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-7 w-7 rounded-lg bg-black text-[11px] font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Especificaciones del Item</span>
                          </div>
                          {items.length > 1 && (
                            <button 
                              onClick={() => removeItem(index)}
                              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                          <div className="md:col-span-12 space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Descripción del Contenido</Label>
                            <Input
                              placeholder="Ej. 12 Pallets de materia prima alimentaria..."
                              value={item.description}
                              onChange={(e) => updateItem(index, 'description', e.target.value)}
                              className="h-11 bg-white border-slate-200 focus:border-black focus:ring-0 transition-all rounded-xl text-sm font-medium px-4"
                            />
                          </div>
                          
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 text-center block">Largo (m)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.largo}
                              onChange={(e) => updateItem(index, 'largo', e.target.value)}
                              className="h-11 bg-white border-slate-200 focus:border-black focus:ring-0 transition-all rounded-xl text-center font-bold text-base"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 text-center block">Ancho (m)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.ancho}
                              onChange={(e) => updateItem(index, 'ancho', e.target.value)}
                              className="h-11 bg-white border-slate-200 focus:border-black focus:ring-0 transition-all rounded-xl text-center font-bold text-base"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 text-center block">Alto (m)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.alto}
                              onChange={(e) => updateItem(index, 'alto', e.target.value)}
                              className="h-11 bg-white border-slate-200 focus:border-black focus:ring-0 transition-all rounded-xl text-center font-bold text-base"
                            />
                          </div>
                          <div className="md:col-span-3 space-y-2">
                            <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1 text-center block">Peso (Ton)</Label>
                            <Input
                              type="number"
                              placeholder="0.00"
                              value={item.peso}
                              onChange={(e) => updateItem(index, 'peso', e.target.value)}
                              className="h-11 bg-white border-slate-200 focus:border-black focus:ring-0 transition-all rounded-xl text-center font-bold text-base text-slate-900"
                            />
                          </div>
                          <div className="md:col-span-12 flex justify-end">
                             <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cantidad</Label>
                                <Input
                                  type="number"
                                  placeholder="1"
                                  value={item.cantidad}
                                  onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
                                  className="h-8 w-16 bg-white border-slate-200 text-center font-bold rounded-lg text-sm focus:border-black focus:ring-0 transition-all"
                                />
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex justify-center">
                    <button
                      onClick={handleCalculate}
                      className="flex items-center gap-3 bg-black text-white px-10 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all active:scale-95 text-sm uppercase tracking-wide"
                    >
                      <Calculator className="h-5 w-5" />
                      Calcular Propuesta
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="bg-white h-16 w-16 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                    <Truck className="h-8 w-8 text-slate-200" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Módulo en Desarrollo</h3>
                  <p className="text-sm text-slate-400 max-w-xs mx-auto mt-2">Estamos trabajando en la configuración de <b>{clientData.serviceType}</b>.</p>
                </div>
              )}

              {/* Resultados */}
              {(suggestedVehicle || calculatedPrice > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {suggestedVehicle && (
                    <div className="bg-black rounded-2xl p-6 text-white animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white/10 h-10 w-10 rounded-lg flex items-center justify-center">
                          <Truck className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Unidad Sugerida</p>
                          <h3 className="text-lg font-bold text-white uppercase tracking-tight">{suggestedVehicle.name}</h3>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-0.5">Capacidad</p>
                          <p className="text-sm font-bold text-white">{suggestedVehicle.pesoMax + suggestedVehicle.sobrepesoMax} Ton</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                          <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mb-0.5">Medidas</p>
                          <p className="text-sm font-bold text-white">{suggestedVehicle.largo}x{suggestedVehicle.ancho}m</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {calculatedPrice > 0 && (
                    <div className="bg-white rounded-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-500">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-black h-10 w-10 rounded-lg flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cotización Final</p>
                          <h3 className="text-2xl font-bold text-slate-900 tracking-tighter">
                            ${calculatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </h3>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mb-1">Ruta</p>
                        <p className="text-[11px] font-bold text-slate-600 truncate flex items-center gap-2">
                          {clientData.origin} <ArrowRight className="h-3 w-3 text-slate-300" /> {clientData.destination}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-white flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all text-xs uppercase tracking-wider group"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Atrás
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-slate-400 font-bold hover:text-slate-900 transition-all text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
            
            {step === 2 && (
              <button
                onClick={handleSave}
                disabled={loading || !selectedVehicle}
                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-xs uppercase tracking-wider"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Emitir Cotización</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
