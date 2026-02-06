export interface Quote {
  id: string;
  clientName: string;
  projectName: string;
  date: string;
  amount: number;
  status: "aprobada" | "pendiente" | "rechazada";
  validUntil: string;
  items?: any[];
  origin?: string;
  destination?: string;
  vehicleType?: string;
}
