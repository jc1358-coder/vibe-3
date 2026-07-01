import { apiGet } from "./client";

export type SystemStatus = {
  api: string;
  database: string;
  databasePath: string;
};

export async function getSystemStatus(): Promise<SystemStatus> {
  const [apiHealth, dbHealth] = await Promise.all([
    apiGet<{ status: string }>("/api/health"),
    apiGet<{ status: string; database_path: string }>("/api/health/db")
  ]);

  return {
    api: apiHealth.status,
    database: dbHealth.status,
    databasePath: dbHealth.database_path
  };
}
