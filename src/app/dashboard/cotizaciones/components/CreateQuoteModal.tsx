import { useState, useEffect } from "react";
import { X, Calculator, Truck, ArrowRight, Save, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recommendVehicle, VehicleSpec, VEHICLE_SPECS } from "@/lib/vehiclesData";

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

export function CreateQuoteModal({ isOpen, onClose }: CreateQuoteModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availableVehicles, setAvailableVehicles] = useState<VehicleSpec[]>([]);
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  
  // Form Data
  const [clientData, setClientData] = useState({
    clientName: "",
    projectName: "",
    origin: "",
    destination: "",
    date: new Date().toISOString().slice(0, 10)
  });

  // Cubicaje Data
  const [cubicajeData, setCubicajeData] = useState({
    largo: "",
    ancho: "",
    alto: "",
    peso: "", // In Tons
    cantidad: "1"
  });

  const [suggestedVehicle, setSuggestedVehicle] = useState<VehicleSpec | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleSpec | null>(null);

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
    }
  }, [isOpen]);

  const handleCalculate = () => {
    const l = parseFloat(cubicajeData.largo) || 0;
    const w = parseFloat(cubicajeData.ancho) || 0;
    const h = parseFloat(cubicajeData.alto) || 0;
    const weight = parseFloat(cubicajeData.peso) || 0;
    const qty = parseInt(cubicajeData.cantidad) || 1;

    if (l === 0 || w === 0 || h === 0 || weight === 0) {
      toast.error("Por favor ingresa todas las dimensiones y peso");
      return;
    }

    const totalVol = (l * w * h) * qty;
    const totalWeightTons = weight * qty;

    const recommendation = recommendVehicle(totalWeightTons, totalVol, l, w, h, availableVehicles);
    
    if (recommendation) {
      setSuggestedVehicle(recommendation);
      setSelectedVehicle(recommendation);
      
      // Calculate Price
      const tariff = tariffs.find(t => 
        t.origen.toLowerCase().trim() === clientData.origin.toLowerCase().trim() && 
        t.destino.toLowerCase().trim() === clientData.destination.toLowerCase().trim()
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
    if (!clientData.clientName || !clientData.projectName) {
      toast.error("Faltan datos del cliente");
      return;
    }
    
    if (!db) {
      toast.error("Error de conexión con base de datos");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "quotes"), {
        ...clientData,
        vehicleType: selectedVehicle?.name || "No asignado",
        vehicleId: selectedVehicle?.id,
        items: [cubicajeData],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/80">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nueva Cotización</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2 w-2 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-green-500'}`} />
              <p className="text-xs text-gray-500 font-medium">Paso {step} de 2</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Cliente</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Nombre de la empresa"
                    value={clientData.clientName}
                    onChange={(e) => setClientData({...clientData, clientName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Proyecto</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Referencia del proyecto"
                    value={clientData.projectName}
                    onChange={(e) => setClientData({...clientData, projectName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Origen</label>
                  <input
                    type="text"
                    list="origins"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ciudad o CP de origen"
                    value={clientData.origin}
                    onChange={(e) => setClientData({...clientData, origin: e.target.value})}
                  />
                  <datalist id="origins">
                    {Array.from(new Set(tariffs.map(t => t.origen))).map(o => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Destino</label>
                  <input
                    type="text"
                    list="destinations"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    placeholder="Ciudad o CP de destino"
                    value={clientData.destination}
                    onChange={(e) => setClientData({...clientData, destination: e.target.value})}
                  />
                  <datalist id="destinations">
                    {Array.from(new Set(tariffs.map(t => t.destino))).map(d => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Cubicaje Section */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-gray-900">Detalles de la Carga</h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Largo (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      value={cubicajeData.largo}
                      onChange={(e) => setCubicajeData({...cubicajeData, largo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Ancho (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      value={cubicajeData.ancho}
                      onChange={(e) => setCubicajeData({...cubicajeData, ancho: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Alto (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      value={cubicajeData.alto}
                      onChange={(e) => setCubicajeData({...cubicajeData, alto: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Peso (Ton)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder="Toneladas"
                      value={cubicajeData.peso}
                      onChange={(e) => setCubicajeData({...cubicajeData, peso: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      value={cubicajeData.cantidad}
                      onChange={(e) => setCubicajeData({...cubicajeData, cantidad: e.target.value})}
                    />
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCalculate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    <Calculator className="h-4 w-4" />
                    Calcular Vehículo
                  </button>
                </div>
              </div>

              {/* Recommendation Result */}
              {suggestedVehicle && (
                <div className="bg-green-50 rounded-2xl p-6 border border-green-100 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <Truck className="h-6 w-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 text-lg">Vehículo Recomendado</h3>
                      <p className="text-green-700 font-medium mb-2">{suggestedVehicle.name}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-green-800 opacity-80">
                         <span className="bg-green-100 px-2 py-1 rounded">Max Ton: {suggestedVehicle.pesoMax + suggestedVehicle.sobrepesoMax}</span>
                         <span className="bg-green-100 px-2 py-1 rounded">L: {suggestedVehicle.largo}m</span>
                         <span className="bg-green-100 px-2 py-1 rounded">A: {suggestedVehicle.ancho}m</span>
                      </div>
                    </div>
                    <div className="flex items-center h-full">
                       <span className="text-green-600 text-sm font-semibold bg-white/50 px-3 py-1 rounded-full border border-green-200">
                         Seleccionado
                       </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Price Display */}
              {calculatedPrice > 0 && (
                 <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 animate-in fade-in slide-in-from-bottom-6 mt-4">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                           <DollarSign className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="text-sm text-blue-700 font-medium">Costo Estimado</p>
                            <h3 className="text-2xl font-bold text-blue-900">$ {calculatedPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</h3>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs text-blue-600/80">Ruta: {clientData.origin} ➝ {clientData.destination}</p>
                      </div>
                   </div>
                 </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-gray-600 font-medium hover:text-gray-900 text-sm px-2"
            >
              Atrás
            </button>
          ) : (
             <span /> // Spacer
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
            
            {step === 1 ? (
              <button
                onClick={() => {
                  if(!clientData.clientName || !clientData.projectName) {
                    toast.error("Completa los datos requeridos");
                    return;
                  }
                  setStep(2);
                }}
                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/5"
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={loading || !selectedVehicle}
                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-lg shadow-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Crear Cotización'}
                <Save className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
