# FAN

App personal para llevar los movimientos y el saldo de la cuenta bancaria: lee los avisos de compra que el banco envía por correo, guarda fecha, comercio y monto, y permite anotar a mano los depósitos.

Es un registro personal. No es la app oficial del banco ni está conectada a la cuenta.

## Qué hace

- **Saldo de la cuenta**: arriba, el saldo calculado. Se define una vez con el saldo real que muestra el banco y desde ahí cada compra lo descuenta y cada depósito lo suma. Con **Ajustar** se vuelve a cuadrar cuando haga falta.
- **Lectura automática**: una automatización de Atajos envía cada correo del banco, apenas llega a Mail, a un buzón privado en GitHub. FAN lee ese buzón al abrirse y agrega solo las compras que falten. Un mismo aviso nunca se registra dos veces.
- **Pegar un aviso**: alternativa sin configuración. Se copia el texto del correo, se pega en la app y esta extrae los datos.
- **Depósito**: anota a mano un depósito con monto, descripción, fecha y hora. La misma hoja permite anotar un gasto que no llegó por correo (un giro, una transferencia).
- **Movimientos**: todas las transacciones, con el saldo que dejó cada una. Se pueden filtrar (todos, compras, depósitos) y ordenar. Al tocar un movimiento se corrige, se renombra o se elimina.
- **Datos y respaldo**: copia todos los datos como texto y los restaura desde ahí.

## Formato del aviso

El lector reconoce el aviso de compra del Banco de Chile (remitente `enviodigital@bancochile.cl`):

> Te informamos que se ha realizado una compra por $12.990 con cargo a Cuenta ****0000 en COMERCIO el 01/10/2026 12:30. Revisa Saldos y Movimientos en App Mi Banco o Banco en Línea.

De cada aviso toma el monto, el comercio, la fecha y la hora. Funciona con el texto plano o con el correo en HTML. Deja fuera las compras con tarjeta de crédito y las compras en dólares, porque no corresponden al saldo en pesos de la cuenta.

## Capturar los correos de la app Mail

iOS no permite que una app web lea el correo ni reciba datos de otras apps mientras está cerrada. Para que las compras aparezcan sin hacer nada, cada aviso pasa por un buzón en internet:

1. El correo del banco llega a Mail.
2. Una automatización de **Atajos** lo envía al buzón: un repositorio **privado** de GitHub, donde cada correo queda como un *issue*.
3. FAN lee el buzón al abrirse (y cada vez que vuelves a la app) y agrega las compras nuevas.

Se configura una sola vez, en tres partes.

### 1. Crear el buzón en GitHub

1. Crea un repositorio nuevo, **privado**, llamado `fan-avisos`.
2. Ve a **Settings → Developer settings → Personal access tokens → Fine-grained tokens** y toca **Generate new token**.
3. Ponle un nombre (por ejemplo `FAN`) y elige la expiración. Cuando el token venza habrá que crear otro y volver a conectarlo.
4. En **Repository access** elige **Only select repositories** y marca `fan-avisos`.
5. En **Permissions**, da a **Issues** el acceso **Read and write**.
6. Toca **Generate token** y copia el token. GitHub lo muestra una sola vez.

### 2. Conectar FAN

1. En FAN, toca **Conectar buzón**.
2. Escribe el repositorio (`tu-usuario/fan-avisos`) y pega el token.
3. Toca **Probar y conectar**. FAN muestra entonces los datos para el paso siguiente, con botones para copiarlos.

### 3. Crear la automatización en Atajos

1. Abre **Atajos**, entra a **Automatización** y toca **+**.
2. Elige **Correo electrónico** y en **Remitente** escribe `enviodigital@bancochile.cl`.
3. Marca **Ejecutar inmediatamente**, toca **Siguiente** y elige **Nueva automatización en blanco**.
4. Toca **Agregar acción**, busca «URL» y elige **Obtener contenido de URL**. En la URL pega `https://api.github.com/repos/tu-usuario/fan-avisos/issues`.
5. Toca **Mostrar más** y en **Método** elige **POST**.
6. En **Encabezados**, agrega uno nuevo con la clave `Authorization` y el valor `Bearer ` seguido del token.
7. En **Solicitar cuerpo** deja **JSON** y agrega dos campos de tipo **Texto**: `title` con el valor `Aviso`, y `body` con la variable **Entrada del atajo**.
8. Toca **Listo**.

Notas:

- Los avisos deben llegar a una cuenta agregada en la app Mail del iPhone. Los nombres de las opciones pueden variar un poco según la versión de iOS.
- El token da acceso solo a los *issues* de ese repositorio privado. Queda guardado en Atajos y, dentro de FAN, solo en el dispositivo; no entra en los respaldos.
- La automatización envía todos los correos de ese remitente. FAN usa los avisos de compra y deja pasar el resto; en **Buzón y atajo** muestra el último correo que no era una compra.
- Para comprobar que Atajos funciona, mira la pestaña **Issues** del repositorio después de una compra: debe aparecer un *issue* nuevo con el texto del correo.
- Una compra eliminada en FAN no vuelve a aparecer al leer el buzón. Para recuperarla, se pega su aviso a mano.
- La lectura del buzón funciona en la app publicada en GitHub Pages. Dentro de Claude, la página no puede llamar a GitHub y las compras se agregan pegando el aviso.

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

Los movimientos y el saldo quedan en el `localStorage` del navegador, en el dispositivo. Este repositorio solo contiene el código de la app. Los correos del banco pasan por el buzón, que es un repositorio privado aparte.

- `fan-movimientos`: cada movimiento con tipo (`c` compra o gasto, `d` depósito), fecha (`date`), hora (`time`), descripción (`desc`), monto en pesos (`amount`), origen (`mail` o `manual`) y, en las compras leídas de un aviso, la clave que evita duplicados (`key`).
- `fan-cuenta`: el saldo ajustado (`amount`), cuándo se ajustó (`at`) y los avisos eliminados a propósito (`ignored`).
- `fan-preferencias`: orden del listado, repositorio y token del buzón, y momento de la última lectura.

El saldo que se muestra es el saldo ajustado más los movimientos posteriores a ese ajuste. Los movimientos anteriores quedan como historial y no lo cambian.

## Icono

El icono es un diseño propio: un sobre del que asoma una moneda dorada, sobre fondo ciruela. Representa el aviso del banco convertido en movimiento. No reproduce logotipos del banco, que pertenecen a sus dueños.
