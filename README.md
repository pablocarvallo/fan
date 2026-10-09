# FAN

App personal para llevar los movimientos y el saldo de la cuenta bancaria: lee los avisos de compra que el banco envía por correo, guarda fecha, comercio y monto, y permite anotar a mano los depósitos.

Es un registro personal. No es la app oficial del banco ni está conectada a la cuenta.

## Qué hace

- **Saldo de la cuenta**: arriba, el saldo calculado. Se define una vez con el saldo real que muestra el banco y desde ahí cada compra lo descuenta y cada depósito lo suma. Con **Ajustar** se vuelve a cuadrar cuando haga falta.
- **Traer de Mail**: lee el archivo donde la app Atajos va guardando los avisos del banco y agrega solo las compras que falten. Un mismo aviso nunca se registra dos veces.
- **Pegar un aviso**: alternativa sin configuración. Se copia el texto del correo, se pega en la app y esta extrae los datos.
- **Depósito**: anota a mano un depósito con monto, descripción, fecha y hora. La misma hoja permite anotar un gasto que no llegó por correo (un giro, una transferencia).
- **Movimientos**: todas las transacciones, con el saldo que dejó cada una. Se pueden filtrar (todos, compras, depósitos) y ordenar. Al tocar un movimiento se corrige, se renombra o se elimina.
- **Datos y respaldo**: copia todos los datos como texto y los restaura desde ahí.

## Formato del aviso

El lector reconoce el aviso de compra del Banco de Chile (remitente `enviodigital@bancochile.cl`):

> Te informamos que se ha realizado una compra por $12.990 con cargo a Cuenta ****0000 en COMERCIO el 01/10/2026 12:30. Revisa Saldos y Movimientos en App Mi Banco o Banco en Línea.

De cada aviso toma el monto, el comercio, la fecha y la hora. Funciona con el texto plano o con el correo en HTML, y con varios avisos seguidos en un mismo archivo. Deja fuera las compras con tarjeta de crédito y las compras en dólares, porque no corresponden al saldo en pesos de la cuenta.

## Capturar los correos de la app Mail

iOS no permite que una app web lea el correo por su cuenta. El puente es la app **Atajos**: una automatización guarda el texto de cada aviso en un archivo de iCloud Drive, y FAN lee ese archivo. Se configura una sola vez.

1. Abre **Atajos**, entra a **Automatización** y toca **+**. Si es la primera automatización, el botón dice **Crear automatización personal**.
2. Elige **Correo electrónico**. En **Remitente** escribe `enviodigital@bancochile.cl`.
3. Marca **Ejecutar inmediatamente** y toca **Siguiente**.
4. Elige **Nueva automatización en blanco**, toca **Agregar acción**, busca «archivo de texto» y elige **Agregar a archivo de texto**.
5. En la acción, toca **Texto** y elige **Entrada del atajo**. En **Ruta del archivo** escribe `fan.txt` y deja la carpeta **Atajos** (Shortcuts) de iCloud Drive.
6. Toca **Listo**.

Después de cada compra, abre FAN, toca **Traer de Mail** y elige `fan.txt` en Archivos → iCloud Drive → Atajos. Desde la primera vez que funciona, el botón abre directamente el selector de archivos.

Requisitos y notas:

- Los avisos deben llegar a una cuenta agregada en la app Mail del iPhone. Una cuenta de Gmail agregada ahí también sirve; Mail la revisa cada cierto tiempo (Ajustes de Mail → Obtener datos nuevos), así que el aviso se guarda cuando Mail lo descarga.
- Los nombres de las opciones pueden variar un poco según la versión de iOS.
- El archivo `fan.txt` crece con cada aviso. Se puede borrar cuando se quiera: FAN conserva lo que ya trajo.
- Una compra eliminada en FAN no vuelve a aparecer al traer el archivo. Para recuperarla, se pega su aviso a mano.

## Instalar en el iPhone

1. En GitHub, ve a **Settings → Pages** y publica la rama `main` desde la raíz (`/`). La app queda en `https://pablocarvallo.github.io/fan/`.
2. Abre esa dirección en **Safari** en el iPhone.
3. Toca **Compartir → Añadir a pantalla de inicio**.

Se abre como app independiente, con su icono, y funciona sin conexión.

## Archivos

| Archivo | Uso |
| --- | --- |
| `index.html` | La app completa (HTML, CSS y JavaScript sin dependencias de compilación) |
| `manifest.webmanifest` | Nombre, colores e iconos de la app instalada |
| `sw.js` | Service worker para uso sin conexión |
| `icons/icon-full.svg` | Icono original a pantalla completa (fuente de los PNG) |
| `icons/icon.svg` | Icono con esquinas redondeadas (favicon) |
| `icons/apple-touch-icon.png` | Icono de 180 px para la pantalla de inicio del iPhone |
| `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-1024.png` | Iconos del manifiesto y archivo de alta resolución |

## Datos

Todo queda en el `localStorage` del navegador, en el dispositivo. Este repositorio solo contiene el código de la app: ningún movimiento ni saldo se sube a GitHub.

- `fan-movimientos`: cada movimiento con tipo (`c` compra o gasto, `d` depósito), fecha (`date`), hora (`time`), descripción (`desc`), monto en pesos (`amount`), origen (`mail` o `manual`) y, en las compras leídas de un aviso, la clave que evita duplicados (`key`).
- `fan-cuenta`: el saldo ajustado (`amount`), cuándo se ajustó (`at`) y los avisos eliminados a propósito (`ignored`).
- `fan-preferencias`: orden del listado y si ya se usó el archivo de Atajos.

El saldo que se muestra es el saldo ajustado más los movimientos posteriores a ese ajuste. Los movimientos anteriores quedan como historial y no lo cambian.

## Icono

El icono es un diseño propio: un abanico dorado sobre fondo ciruela. No reproduce logotipos del banco, que pertenecen a sus dueños.
