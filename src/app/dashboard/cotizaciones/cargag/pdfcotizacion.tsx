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
  cantidad?: string; // mapping from page.tsx
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
  empresa: string | { name: string; email?: string; [key: string]: any }; // Handle string or object
  emitente: string;
  origen: string;
  destino: string;
  items: CargoItem[];
  tipoCarga: string;
  tipoServicio: string; // Equipment name
  basePrice: number;
  equipmentName?: string; // Sometimes it's here
  tariffType?: string;
  nombreCliente?: string; // Explicit client name from form
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

export const PDFCotizacion: React.FC<PDFCotizacionProps> = ({ data }) => {
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
  const retencion = subtotal * 0.04; // 4% retention (standard for freight in MX)
  const total = subtotal + impuestoVentas - retencion;

  // Company Name Handling
  const companyName = typeof data.empresa === 'string' ? data.empresa : data.empresa?.name || 'Cliente General';
  
  // Client Name (if different or specifically passed, otherwise fallback to companyName or "Cliente")
  // In a real scenario, you might want to pass a separate "clientName" prop if available.
  // For now, let's assume if companyName looks like a person's name we use it, otherwise we default to "Cliente" or reuse companyName.
  // Since we don't have a separate client field in TicketData, we will reuse companyName but allow it to be editable separately in the UI.
  const clientName = data.nombreCliente || companyName; 
  const equipment = data.equipmentName || data.tipoServicio || 'General';

  // Helper to describe items - NOW EDITABLE STRING
  // Removed single string return, will map in JSX directly for better row handling if needed.
  // But wait, the request is to add rows to the TABLE.
  // Let's modify the table body logic.
  
  const hasMultipleItems = data.items && data.items.length > 0;
  const itemsToRender = hasMultipleItems ? data.items : [{ id: 'default', description: 'General' }];

  const tiempoCarga = data.tiempoCargaDescarga ? `${data.tiempoCargaDescarga} hrs libres` : '24 hrs libres';
  const tolvaPrice = data.precioTolva ? parseFloat(data.precioTolva) : 0;

  return (
    <div className="w-full bg-white text-black text-xs font-sans p-8 leading-tight print:p-0 print:m-0">
      <style jsx global>{`
        @media print {
          @page {
            margin: 10mm;
            size: auto;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
          <div className="font-bold text-lg mb-2"><Editable>COTIZACIÓN</Editable></div>
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
              <th className="border border-gray-300 p-2"><Editable>Tipo de carga / Cargo Type</Editable></th>
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
                      <td className="border border-gray-300 p-2 uppercase"><Editable>{data.tipoCarga || 'General'}</Editable></td>
                    </tr>
                 );
              })
            ) : (
                <tr>
                  <td className="border border-gray-300 p-2"><Editable>{data.origen}</Editable></td>
                  <td className="border border-gray-300 p-2"><Editable>{data.destino}</Editable></td>
                  <td className="border border-gray-300 p-2">
                    <Editable>General</Editable>
                  </td>
                  <td className="border border-gray-300 p-2 uppercase"><Editable>{equipment}</Editable></td>
                  <td className="border border-gray-300 p-2 uppercase"><Editable>{data.tipoCarga || 'General'}</Editable></td>
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
              <th className="border border-gray-300 p-2"><Editable>Tiempo Carga/Descarga<br/>Loading Time</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Costo Unitario / Unit Cost</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Impuestos / Taxes</Editable></th>
              <th className="border border-gray-300 p-2"><Editable>Tarifa / Rate</Editable></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 p-2"><Editable>1</Editable></td>
              <td className="border border-gray-300 p-2 text-left">
                <Editable>Servicio de Flete Terrestre</Editable><br/>
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

      {/* SECCION 6: CLAUSULAS Y PIE DE PAGINA */}
      <div className="text-[10px] text-justify space-y-4 border-t pt-4">
        <h4 className="font-bold uppercase text-xs"><Editable>Cláusulas / Clauses:</Editable></h4>
        <ol className="list-decimal list-outside pl-4 space-y-1 text-gray-700">
          <li><Editable>NO INCLUYE NINGUN TIPO DE SEGURO DE MERCANCIA, SE TRANSPORTA POR CUENTA Y RIESGO DEL CLIENTE, NUESTRA RESPONSABILIDAD QUEDA LIMITADA A LA CLAUSULA NOVENA DE LAS CONDICIONES DEL CONTRATO DE TRANSPORTE AL REVERSO DE LA CARTA PORTE.</Editable></li>
          <li><Editable>EN CASO DE ASIGNAR EL PROYECTO A NUESTRA EMPRESA, SI EL CLIENTE CAMBIA FECHA PLANEADA DE CARGAS, NOS RESERVAMOS EL DERECHO DE CAMBIAR FECHAS Y CONDICIONES EN INICIO DEL PROYECTO.</Editable></li>
          <li><Editable>TODA REFACTURACION SOLICITADA POR EL CLIENTE, DEBIDO A ERRORES DE INFORMACION NO COTEJADOS DESDE LA SOLICITUD DEL SERVICIO GENERARÁ UN COSTO EXTRA DE $ 1,000.00 MAS IVA.</Editable></li>
          <li><Editable>LOS SERVICIOS REALIZADOS EN TERRITORIO MEXICANO SON MAS IMPUESTOS.</Editable></li>
          <li><Editable>EL PRECIO DE ESTA COTIZACION ES SOLO POR 30 DIAS A PARTIR DE LA FECHA DE SU EXPEDICION.</Editable></li>
          <li><Editable>LA MERCANCIA SERA CARGADA SEGÚN LOS PUNTOS DE GRAVEDAD Y ESPECIFICACIONES DE LAS CARGAS QUE EL CLIENTE OTORGUE, NO SOMOS RESPONSABLES DE CUALQUIER PERCANCE POR OMISIONES DE ESTA INDOLE.</Editable></li>
          <li><Editable>NUESTRO PERSONAL SE APEGARA AL PLAN DE EMBARQUE ESPECIFICADO DE COMUN ACUERDO, POR LO TANTO, NO SOMOS RESPONSABLES DE CAULQUIER RETRASO O DEMORA POR FALTA DE ALGUN DOCUMENTO, HUELGA, INCLEMENCIA DE TIEMPO, DISTURBIO SOCIAL, PERIODOS DE INACTIVIDAD PROVOCADOS POR SITUACIONES AJENAS A NUESTRO EQUIPO DE TRABAJO, EN CASO DE INCURRIR EN ESTO, SE CONSIDERAN DEMORAS.</Editable></li>
          <li><Editable>FLETE EN FALSO COSTO 70% COSTO DE SERVICIO.</Editable></li>
          <li><Editable>LA RUTA PARA TOMAR SON DECISION DE NUESTRO EQUIPO Y PERSONAL AUTORIZDO O SCT.</Editable></li>
          <li><Editable>LOS SERVICIOS INCLUYEN PERSONAL Y UNIDADES PILOTO EN EL CASO DE SER REQUERIDOS POR LA SCT.</Editable></li>
          <li><Editable>EN CASO DE MERCANCIAS USADAS NO NOS HACEMOS RESPONSABLES POR DAÑOS OCULTOS O VISIBLES. EL USUARIO ACEPTA EL RIESGO.</Editable></li>
          <li><Editable>ESTA COTIZACION INCLUYE PERMISOS, UNIDADES PILOTO, AMARRES, CADENAS, AUTOPISTAS.</Editable></li>
          <li><Editable>NO INCLUYE MANIOBRAS DE CARGA Y/O DESCARGA.</Editable></li>
          <li><Editable>NO INCLUYE LIBRANZAS, ADECUACIONES, CONSTRUCCIONES DE CAMINOS, ETC. QUE REQUIERA LA RUTA PARA LA TRANSPORTACION. ESTE COSTO ES UNICAMENTE POR EL TRANSPORTE DESDE EL LUGAR INDICADO COMO ORIGEN HASTA EL SITIO DE ACOPIO Y/O PUNTO INDICADO COMO DESTINO QUE ESTE EN CONDICIONES DE DESCARGA EN PARQUES EOLICOS.</Editable></li>
          <li><Editable>LA RESPONSABILIDAD DE MEJORAS, FABRICACIONES DE CAMINOS, ACCESOS, ETC. SON RESPONSABILIDAD DEL CLIENTE Y DEBERAN CUMPLIR Y ESTAR ACORDES A LOS REQUERIMIENTOS MINIMOS PRESENTADOS TANTO EN RADIO DE GIRO, CURVAS VERTICALES Y PENDIENTES.</Editable></li>
          <li><Editable>SE TIENE EL DERECHO TOTAL Y ABSOLUTO SOBRE TODA LA DIFUSION FOTOGRAFICA, AUDIOVISUAL DE LOS SERVICIOS DE TRANSPORTE. SON EXCLUSIVIDAD DE TRANSPORTES LUJAV.</Editable></li>
          <li><Editable>NUESTRO SERVICIO INCLUYE MONITOREO GPS HASTA LA ENTREGA DE SU CARGA EN DESTINO.</Editable></li>
          <li><Editable>LA ACEPTACION DEL SERVICIO IMPLICA LA ACEPTACION TACITA DE LAS CONDICIONES QUE AQUÍ SE EXPRESAN.</Editable></li>
        </ol>

        <div className="mt-4 border-t border-gray-200 pt-4 grid grid-cols-2 gap-8">
          <div>
            <p className="font-bold mb-2"><Editable>Si tiene alguna duda sobre este presupuesto, póngase en contacto con:</Editable></p>
            <div className="space-y-1">
              <p><Editable>Ing. Lucio Javier Padua Tress - Cel. 924 242 7410</Editable></p>
              <p><Editable>Natalia García Arroyo - Cel. 922 106 1826</Editable></p>
              <p><Editable>Omar Moises Reyes del Valle - Cel. 229 520 7062</Editable></p>
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

        <div className="mt-6 border-t-2 border-black pt-4">
           <p className="font-bold text-red-600 mb-2"><Editable>NOTAS IMPORTANTES:</Editable></p>
           <ul className="list-disc pl-5 space-y-1 text-gray-600">
             <li><Editable>LOS SIGUIENTES CARGOS SE APLICARAN SI ES NECESARIO, ADICIONAL A LOS DEMAS CARGOS APLICABLES.</Editable></li>
             <li><Editable>LA EMPRESA TRANSPORTES LUJAV SE DESLINDA DE CUALQUIER RESPONSABILIDAD RESPECTO DE PERSONAS AJENAS ENVIADAS POR EL SOLICITANTE QUE ACOMPAÑE AL OPERADOR EN LA UNIDAD CONTRATADA.</Editable></li>
             <li><Editable>SI EL SOLICITANTE PROPORCIONA A LA EMPRESA TRANSPORTES LUJAV, PESOS Y MEDIDAS INCORRECTAS DE SU MERCANCIA A TRANSPORTAR, EL SOLICITANTE SE OBLIGA A PAGAR LAS INFRACCIONES Y MULTAS CORRESPONDIENTES.</Editable></li>
           </ul>
        </div>

        <div className="mt-8">
          <p className="text-center italic mb-8 px-8">
            <Editable>ESTIMADO CLIENTE PARA ORDENAR EL SERVICIO AQUÍ ESPECIFICADO, LE AGRADECEMOS DEVOLVERLO FIRMADO CON SU AUTORIZACION, COMO QUE YA A FALTA DE ESTE RESQUISITO NO SE PODRA EFECTUAR EL SERVICIO.</Editable>
          </p>
          
          <div className="flex justify-between items-end px-12 mt-16">
            <div className="text-center">
              <div className="border-t border-black w-48 mx-auto mb-2"></div>
              <div className="font-bold"><Editable>CLIENTE</Editable></div>
              <div className="text-xs uppercase mt-1"><Editable>{companyName}</Editable></div>
              <div className="text-[9px] mt-1"><Editable>FIRMA DE CONFORMIDAD</Editable></div>
            </div>
            
            <div className="text-center">
               <div className="font-bold mb-1"><Editable>NELLY TRESS TAKAHASHI</Editable></div>
               <div className="border-t border-black w-48 mx-auto mb-2"></div>
               <div className="font-bold"><Editable>TRANSPORTES LUJAV</Editable></div>
               <div className="text-[9px]"><Editable>ING. LUCIO JAVIER PADUA TRESS</Editable></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
