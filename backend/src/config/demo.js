/**
 * Modo demo (web pública para el portfolio).
 * Se activa con DEMO_MODE=true en una instalación aparte con su propia base de datos.
 * Las cuentas de demo tienen contraseña pública y están protegidas para que ningún
 * visitante pueda cambiarles la contraseña, borrarlas, bloquearlas o quitarles el rol.
 */

export const isDemoMode = () => process.env.DEMO_MODE === "true";

export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = [
  { role: "ADMIN", email: "admin.demo@example.com", name: "Ana Torres (Admin demo)" },
  { role: "USER", email: "usuario.demo@example.com", name: "Lucía Martín (Usuaria demo)" },
];

/** true si es una cuenta de demo protegida (solo en modo demo). */
export const isProtectedDemoAccount = (email) =>
  isDemoMode() && DEMO_ACCOUNTS.some((account) => account.email === String(email).toLowerCase());

/** Datos públicos para la pantalla de inicio de sesión. */
export const publicDemoInfo = () =>
  isDemoMode()
    ? {
        demo: true,
        resetsDaily: true,
        accounts: DEMO_ACCOUNTS.map(({ role, email }) => ({ role, email, password: DEMO_PASSWORD })),
      }
    : { demo: false, accounts: [] };
