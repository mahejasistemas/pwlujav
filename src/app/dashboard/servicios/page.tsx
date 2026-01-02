export default function ServiciosPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#B80000]">Servicios</h1>
          <p className="text-gray-500 mt-1">Gestión de servicios ofrecidos</p>
        </div>
      </div>
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white p-6">
        <p className="text-gray-500">Contenido de servicios próximamente...</p>
      </div>
    </div>
  );
}
