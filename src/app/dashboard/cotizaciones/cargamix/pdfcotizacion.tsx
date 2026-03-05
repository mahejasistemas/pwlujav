import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CargoItem {
  id: string;
  description?: string;
  quantity?: number | string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  cantidad?: string; 
  largo?: string;
  ancho?: string;
  alto?: string;
  peso?: string;
}

interface TicketData {
  folio: string;
  fechaExpedicion: Date | string;
  fechaVigencia: Date | string;
  divisa: string;
  empresa: string | { name: string; email?: string; [key: string]: any }; 
  emitente: string;
  origen: string;
  destino: string;
  items: CargoItem[];
  tipoCarga: string;
  tipoServicio: string; 
  basePrice: number;
  equipmentName?: string; 
  tariffType?: string;
  nombreCliente?: string; 
  tiempoCargaDescarga?: string;
  precioTolva?: string;
}

interface PDFCotizacionProps {
  data: TicketData;
}

const Editable = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <span 
    contentEditable 
    suppressContentEditableWarning
    className={`outline-none hover:bg-red-50 focus:bg-red-50 transition-colors cursor-text rounded px-0.5 ${className}`}
  >
    {children}
  </span>
);

export const PDFCotizacionMix: React.FC<PDFCotizacionProps> = ({ data }) => {
  if (!data) return null;

  // Helper to safely format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: data.divisa || 'MXN',
    }).format(amount);
  };

  // Helper to format date
  const formatDate = (date: Date | string) => {
    if (!date) return '';
    const d = new Date(date);
    return format(d, 'dd/MM/yyyy', { locale: es });
  };

  // Calculations
  const subtotal = (data.basePrice || 0) + (data.precioTolva ? parseFloat(data.precioTolva) : 0);
  const tasaImpositiva = 0.16; // 16%
  const impuestoVentas = subtotal * tasaImpositiva;
  const retencion = subtotal * 0.04; // 4% retention
  const total = subtotal + impuestoVentas - retencion;

  const companyName = typeof data.empresa === 'string' ? data.empresa : data.empresa?.name || 'Cliente General';
  const clientName = data.nombreCliente || companyName; 
  const equipment = data.equipmentName || data.tipoServicio || 'Carga Mixta';

  const hasMultipleItems = data.items && data.items.length > 0;
  
  const tiempoCarga = data.tiempoCargaDescarga ? `${data.tiempoCargaDescarga} hrs libres` : '24 hrs libres';
  const tolvaPrice = data.precioTolva ? parseFloat(data.precioTolva) : 0;

  return (
    <div className="w-full bg-white text-black text-xs font-sans p-8 leading-tight print:p-0 print:m-0 printable-content">
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            visibility: hidden;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .printable-content {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0 !important;
            padding: 0 !important;
          }
          .printable-content * {
            visibility: visible;
          }
          
          /* Force background colors */
          .bg-red-600 {
            background-color: #dc2626 !important;
            color: white !important;
          }
          .bg-red-100 {
            background-color: #fee2e2 !important;
            color: #7f1d1d !important;
          }
          .bg-red-50 {
            background-color: #fef2f2 !important;
            color: #7f1d1d !important;
          }
          /* Hide tooltips and dialog overlays if they interfere */
          [role="dialog"] {
             position: static !important;
             background: white !important;
          }
        }
      `}</style>
      
      {/* SECCION 1: CABECERA */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div className="w-1/3">
          {/* LOGO */}
          <div className="relative h-32 w-64 mb-2">
             <img src="/logolujav.png" alt="Transportes Lujav" className="object-contain h-full w-full object-left" />
          </div>
        </div>
        
        <div className="w-1/2 text-center space-y-1">
          <div className="font-bold text-lg mb-2"><Editable>COTIZACIÓN CARGA MIXTA</Editable></div>
          <div className="grid grid-cols-2 gap-x-4 text-xs text-right">
            <div className="font-bold text-gray-600"><Editable>Fecha / Date:</Editable></div>
            <div className="text-left"><Editable>{formatDate(data.fechaExpedicion)}</Editable></div>
            
            <div className="font-bold text-gray-600"><Editable>Num. De cotización / Quote No:</Editable></div>
            <div className="text-left"><Editable>{data.folio}</Editable></div>
            
            <div className="font-bold text-gray-600"><Editable>Vigencia / Validity:</Editable></div>
            <div className="text-left"><Editable>{formatDate(data.fechaVigencia)}</Editable></div>
            
            <div className="font-bold text-gray-600"><Editable>Moneda / Currency:</Editable></div>
            <div className="text-left"><Editable>{data.divisa || 'MXN'}</Editable></div>

            <div className="font-bold text-gray-600"><Editable>Correo / Email:</Editable></div>
            <div className="text-left break-all"><Editable>contacto@transporteslujav.com</Editable></div>
          </div>
        </div>
      </div>

      {/* SECCION 2: DATOS DE LA EMPRESA Y CLIENTE */}
      <div className="flex justify-between mb-6 gap-8">
        <div className="w-1/2 space-y-1">
          <h3 className="font-bold text-sm mb-2 border-b border-gray-300"><Editable>EMISOR / ISSUER</Editable></h3>
          <div className="font-bold"><Editable>NELLY TRESS TAKAHASHI</Editable></div>
          <div><Editable>RFC: TETN680531TJ6</Editable></div>
          <div><Editable>Carr. Libramiento Santa Fe San Julian Km. 3.7</Editable></div>
          <div><Editable>Col. Nueva Dr. Delfino A. Victoria, 91690</Editable></div>
          <div><Editable>Veracruz, Ver.</Editable></div>
          <div><Editable>Cel. 924 242 7410, 924 102 5856</Editable></div>
        </div>

        <div className="w-1/2 space-y-1">
          <h3 className="font-bold text-sm mb-2 border-b border-gray-300"><Editable>CLIENTE / CLIENT</Editable></h3>
          <div className="grid grid-cols-[100px_1fr] gap-1">
            <div className="font-bold"><Editable>Cliente:</Editable></div>
            <div className="uppercase"><Editable>{clientName}</Editable></div>

            <div className="font-bold"><Editable>Presupuesto:</Editable></div>
            <div><Editable>{data.folio}</Editable></div>
            
            <div className="font-bold"><Editable>Empresa:</Editable></div>
            <div className="uppercase"><Editable>{companyName}</Editable></div>
            
            <div className="font-bold"><Editable>Vendedor:</Editable></div>
            <div><Editable>{data.emitente}</Editable></div>
            
            <div className="font-bold"><Editable>Moneda:</Editable></div>
            <div><Editable>{data.divisa || 'MXN'}</Editable></div>
          </div>
        </div>
      </div>

      {/* SECCION 3: DESCRIPCION DEL SERVICIO */}
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 bg-red-100 text-red-900 p-1"><Editable>DESCRIPCIÓN DEL SERVICIO / SERVICE DESCRIPTION</Editable></h3>
        <table className="w-full border-collapse border border-gray-300 text-center text-xs">
          <thead className="bg-red-600 text-white font-bold">
            <tr>
              <th className="border border-gray-300 p-2"><Editable>Origen / Origin</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Destino / Destination</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Carga / Cargo</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Equipo / Equipment</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Modalidad</Editable></th>
            </tr>
          </thead>
          <tbody>
            {hasMultipleItems ? (
              data.items.map((item, index) => {
                 const qty = item.cantidad || item.quantity || 1;
                 const desc = item.description ? item.description : `${qty} Bultos`;
                 const dims = (item.largo && item.ancho && item.alto) ? `(${item.largo}m x ${item.ancho}m x ${item.alto}m)` : '';
                 const fullDesc = `${desc} ${dims}`;
                 
                 return (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2"><Editable>{data.origen}</Editable></td>
                      <td className="border border-gray-300 p-2"><Editable>{data.destino}</Editable></td>
                      <td className="border border-gray-300 p-2">
                        <Editable>{fullDesc}</Editable>
                      </td>
                      <td className="border border-gray-300 p-2 uppercase"><Editable>{equipment}</Editable></td>
                      <td className="border border-gray-300 p-2 uppercase"><Editable>{data.tipoCarga || 'Sencillo'}</Editable></td>
                    </tr>
                 );
              })
            ) : (
                <tr>
                  <td className="border border-gray-300 p-2"><Editable>{data.origen}</Editable></td>
                  <td className="border border-gray-300 p-2"><Editable>{data.destino}</Editable></td>
                  <td className="border border-gray-300 p-2">
                    <Editable>Carga Mixta</Editable>
                  </td>
                  <td className="border border-gray-300 p-2 uppercase"><Editable>{equipment}</Editable></td>
                  <td className="border border-gray-300 p-2 uppercase"><Editable>{data.tipoCarga || 'Sencillo'}</Editable></td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECCION 4: PROPUESTA ECONOMICA */}
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-2 bg-red-100 text-red-900 p-1"><Editable>PROPUESTA ECONÓMICA / ECONOMIC PROPOSAL</Editable></h3>
        <table className="w-full border-collapse border border-gray-300 text-center text-xs">
          <thead className="bg-red-600 text-white font-bold">
            <tr>
              <th className="border border-gray-300 p-2"><Editable>Cantidad / Qty</Editable></th>
              <th className="border border-gray-300 p-2 w-1/3"><Editable>Descripción / Description</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Tiempo Carga/Descarga</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Costo Unitario</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Impuestos</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Tarifa / Rate</Editable></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2"><Editable>1</Editable></td>
              <td className="border border-gray-300 p-2 text-left">
                <Editable>Servicio de Flete Carga Mixta</Editable><br/>
                <Editable>{data.origen} - {data.destino}</Editable>
              </td>
              <td className="border border-gray-300 p-2"><Editable>{tiempoCarga}</Editable></td>
              <td className="border border-gray-300 p-2"><Editable>{formatCurrency(data.basePrice)}</Editable></td>
              <td className="border border-gray-300 p-2"><Editable>IVA 16%<br/>RET 4%</Editable></td>
              <td className="border border-gray-300 p-2"><Editable>{formatCurrency(data.basePrice)}</Editable></td>
            </tr>
            {tolvaPrice > 0 && (
              <tr>
                <td className="border border-gray-300 p-2"><Editable>1</Editable></td>
                <td className="border border-gray-300 p-2 text-left">
                  <Editable>Servicio Tolva (Adicional)</Editable>
                </td>
                <td className="border border-gray-300 p-2"><Editable>{tiempoCarga}</Editable></td>
                <td className="border border-gray-300 p-2"><Editable>{formatCurrency(tolvaPrice)}</Editable></td>
                <td className="border border-gray-300 p-2"><Editable>IVA 16%<br/>RET 4%</Editable></td>
                <td className="border border-gray-300 p-2"><Editable>{formatCurrency(tolvaPrice)}</Editable></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* SECCION 5: TOTALES */}
      <div className="flex justify-end mb-8">
        <div className="w-1/3">
          <table className="w-full border-collapse border border-gray-300 text-right text-xs">
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-red-50 text-red-900"><Editable>SUBTOTAL</Editable></td>
                <td className="border border-gray-300 p-2"><Editable>{formatCurrency(subtotal)}</Editable></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-red-50 text-red-900"><Editable>Tasa Impositiva (16%)</Editable></td>
                <td className="border border-gray-300 p-2"><Editable>16.00%</Editable></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-red-50 text-red-900"><Editable>Impuesto Ventas (IVA)</Editable></td>
                <td className="border border-gray-300 p-2"><Editable>{formatCurrency(impuestoVentas)}</Editable></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 font-bold bg-red-50 text-red-900"><Editable>RET. de Fletes (4%)</Editable></td>
                <td className="border border-gray-300 p-2 text-red-600">- <Editable>{formatCurrency(retencion)}</Editable></td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="border border-gray-300 p-2 font-bold text-sm bg-red-600 text-white"><Editable>TOTAL</Editable></td>
                <td className="border border-gray-300 p-2 font-bold text-sm"><Editable>{formatCurrency(total)}</Editable></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECCION 6: PIE DE PAGINA */}
      <div className="text-[10px] text-justify space-y-4 border-t pt-4">
        {/* Same clauses as General Cargo for now */}
        <h4 className="font-bold uppercase text-xs"><Editable>Cláusulas / Clauses:</Editable></h4>
        <ol className="list-decimal list-outside pl-4 space-y-1 text-gray-700">
          <li><Editable>NO INCLUYE NINGUN TIPO DE SEGURO DE MERCANCIA, SE TRANSPORTA POR CUENTA Y RIESGO DEL CLIENTE.</Editable></li>
          <li><Editable>EL PRECIO DE ESTA COTIZACION ES SOLO POR 30 DIAS A PARTIR DE LA FECHA DE SU EXPEDICION.</Editable></li>
          <li><Editable>FLETE EN FALSO COSTO 70% COSTO DE SERVICIO.</Editable></li>
          <li><Editable>NO INCLUYE MANIOBRAS DE CARGA Y/O DESCARGA.</Editable></li>
          <li><Editable>LA ACEPTACION DEL SERVICIO IMPLICA LA ACEPTACION TACITA DE LAS CONDICIONES QUE AQUÍ SE EXPRESAN.</Editable></li>
        </ol>

        <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-2 gap-8">
          <div>
            <p className="font-bold mb-2"><Editable>Contacto:</Editable></p>
            <div className="space-y-1">
              <p><Editable>Ing. Lucio Javier Padua Tress - Cel. 924 242 7410</Editable></p>
            </div>
            <p className="mt-2 italic"><Editable>Gracias por su confianza.</Editable></p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded border border-gray-200">
            <h5 className="font-bold border-b border-gray-300 mb-2 pb-1"><Editable>DATOS BANCARIOS</Editable></h5>
            <div className="grid grid-cols-[120px_1fr] gap-1">
              <div className="font-semibold"><Editable>BANCO:</Editable></div>
              <div><Editable>SANTANDER</Editable></div>
              <div className="font-semibold"><Editable>CLAVE INTERB.:</Editable></div>
              <div><Editable>014849655033158880</Editable></div>
              <div className="font-semibold"><Editable>CUENTA:</Editable></div>
              <div><Editable>065503315888</Editable></div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-center italic mb-8 px-8">
            <Editable>ESTIMADO CLIENTE PARA ORDENAR EL SERVICIO AQUÍ ESPECIFICADO, LE AGRADECEMOS DEVOLVERLO FIRMADO CON SU AUTORIZACION.</Editable>
          </p>
          
          <div className="flex justify-between items-end px-12 mt-16">
            <div className="text-center">
              <div className="border-t border-black w-48 mx-auto mb-2"></div>
              <div className="font-bold"><Editable>CLIENTE</Editable></div>
              <div className="text-xs uppercase mt-1"><Editable>{companyName}</Editable></div>
            </div>
            
            <div className="text-center">
               <div className="font-bold mb-1"><Editable>NELLY TRESS TAKAHASHI</Editable></div>
               <div className="border-t border-black w-48 mx-auto mb-2"></div>
               <div className="font-bold"><Editable>TRANSPORTES LUJAV</Editable></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
