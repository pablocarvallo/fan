# FAN

App personal para llevar los movimientos y el saldo de la cuenta bancaria: lee los avisos de compra que el banco envía por correo, guarda fecha, comercio y monto, y permite anotar a mano los depósitos.

Es un registro personal. No es la app oficial del banco ni está conectada a la cuenta.

## Qué hace

- **Saldo de la cuenta**: arriba, el saldo calculado. Se define una vez con el saldo real que muestra el banco y desde ahí cada compra lo descuenta y cada depósito lo suma. Con **Ajustar** se vuelve a cuadrar cuando haga falta.
- **Lectura de Gmail**: un script en la cuenta de Google entrega los avisos de compra del banco y la app los trae sola al abrirse (o con **Traer de Gmail**). Agrega solo las compras que falten: un mismo aviso nunca se registra dos veces.
- **Pegar un aviso**: alternativa sin configuración. Se copia el texto del correo, se pega en la app y esta extrae los datos.
- **Depósito**: anota a mano un depósito con monto, descripción, fecha y hora. La misma hoja permite anotar un gasto que no llegó por correo (un giro, una transferencia).
- **Movimientos**: todas las transacciones, con el saldo que dejó cada una. Se pueden filtrar (todos, compras, depósitos) y ordenar. Al tocar un movimiento se corrige, se renombra o se elimina.
- **Datos y respaldo**: copia todos los datos como texto y los restaura desde ahí.

## Formato del aviso

El lector reconoce el aviso de compra del Banco de Chile (remitente `enviodigital@bancochile.cl`):

> Te informamos que se ha realizado una compra por $12.990 con cargo a Cuenta ****0000 en COMERCIO el 01/10/2026 12:30. Revisa Saldos y Movimientos en App Mi Banco o Banco en Línea.

De cada aviso toma el monto, el comercio, la fecha y la hora. Funciona con el texto plano o con el correo en HTML, y con varios avisos seguidos. Deja fuera las compras con tarjeta de crédito y las compras en dólares, porque no corresponden al saldo en pesos de la cuenta.

## Conectar con Gmail

Una página web no puede leer el correo por su cuenta. El puente es un script de Google Apps Script que vive en tu propia cuenta de Google: busca los correos de `enviodigital@bancochile.cl`, toma de cada uno la frase del aviso y se la entrega a FAN cuando la app la pide. El script solo lee; no modifica, no envía ni borra correos. Se configura una sola vez y es más cómodo hacerlo en un computador.

1. Entra a [script.google.com](https://script.google.com) con tu cuenta de Gmail y crea un **Nuevo proyecto**.
2. Borra lo que trae el editor y pega el contenido de [`apps-script/Codigo.gs`](apps-script/Codigo.gs) (FAN también lo ofrece con el botón **Copiar el script**). Guarda.
3. Toca **Implementar → Nueva implementación** y elige el tipo **Aplicación web**. En **Ejecutar como** deja **Yo** y en **Quién tiene acceso** elige **Cualquier usuario**.
4. Toca **Implementar** y autoriza el acceso con tu cuenta. Google avisa que la app no está verificada porque el script es tuyo y no pasó por su revisión: entra por **Configuración avanzada** y continúa.
5. Copia la **URL de la aplicación web**, la que termina en `/exec`.
6. En FAN, toca **Conectar Gmail**, pega ese enlace y toca **Probar y conectar**.

Desde ese momento FAN lee Gmail al abrirse y cada vez que vuelves a la app. La primera lectura trae los avisos de los últimos 30 días; las compras anteriores al saldo que definiste quedan como historial y no lo cambian.

Notas:

- **Permiso que pide Google.** Las funciones de Gmail de Apps Script solo existen con el permiso amplio de correo, así que la pantalla de autorización habla de leer, redactar, enviar y eliminar correos. El código publicado aquí solo busca y lee los avisos del remitente indicado.
- **El enlace es la llave.** La implementación queda accesible para quien tenga el enlace, sin iniciar sesión, y entrega solo las frases de los avisos de compra. No lo compartas ni lo subas a ninguna parte. FAN lo guarda solo en el dispositivo.
- **Si el enlace se filtra**, en el editor ve a **Implementar → Administrar implementaciones**, archiva la implementación y crea una nueva. Luego conecta FAN con el enlace nuevo.
- **Para probar el script** en el editor, elige la función `probar`, toca **Ejecutar** y revisa el registro de ejecución: muestra los avisos encontrados.
- Una compra eliminada en FAN no vuelve a aparecer al leer Gmail. Para recuperarla, se pega su aviso a mano.
- La lectura de Gmail funciona en la app publicada en GitHub Pages. Dentro de Claude, la página no puede llamar a Google y las compras se agregan pegando el aviso.

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
| `apps-script/Codigo.gs` | Script de Google Apps Script que entrega los avisos de compra desde Gmail |
| `icons/icon-full.svg` | Icono original a pantalla completa (fuente de los PNG) |
| `icons/icon.svg` | Icono con esquinas redondeadas (favicon) |
| `icons/apple-touch-icon.png` | Icono de 180 px para la pantalla de inicio del iPhone |
| `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-1024.png` | Iconos del manifiesto y archivo de alta resolución |

## Datos

Todo queda en el `localStorage` del navegador, en el dispositivo. Este repositorio solo contiene el código de la app: ningún movimiento ni saldo se sube a GitHub.

- `fan-movimientos`: cada movimiento con tipo (`c` compra o gasto, `d` depósito), fecha (`date`), hora (`time`), descripción (`desc`), monto en pesos (`amount`), origen (`mail` o `manual`) y, en las compras leídas de un aviso, la clave que evita duplicados (`key`).
- `fan-cuenta`: el saldo ajustado (`amount`), cuándo se ajustó (`at`) y los avisos eliminados a propósito (`ignored`).
- `fan-preferencias`: orden del listado, enlace del script de Gmail y momento de la última lectura.

El saldo que se muestra es el saldo ajustado más los movimientos posteriores a ese ajuste. Los movimientos anteriores quedan como historial y no lo cambian.

## Icono

El icono es un diseño propio: un abanico dorado sobre fondo ciruela. No reproduce logotipos del banco, que pertenecen a sus dueños.
