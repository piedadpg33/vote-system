# Sistema de Votación Descentralizado

Este proyecto es una DApp de votación parlamentaria que utiliza **Ethereum Sepolia**, **WalletConnect** y una base de datos **MySQL** para gestionar votaciones, votos y resultados de manera segura y transparente.

---

## Características

- Autenticación y firma con WalletConnect (MetaMask, Trust Wallet, etc.)
- Gestión de votaciones por presidentes
- Votación por diputados con firma digital
- Resultados almacenados en blockchain y consultables públicamente
- Backend en Node.js + Express + MySQL
- Contrato inteligente en Solidity

---

## Estructura del proyecto

- **frontend**: Aplicación React (interfaz de usuario)
- **backend**: Servidor Node.js/Express (API REST y lógica de negocio)
- **voting-contract**: Contrato inteligente Solidity y scripts de despliegue

---

## Requisitos

- Node.js y npm
- MySQL
- Una wallet compatible con WalletConnect (MetaMask, Trust Wallet, etc.)
- Acceso a un nodo Sepolia (Infura, Alchemy, Chainstack...)

---

## Instalación

### 1. Clona el repositorio

```bash
git clone https://github.com/tuusuario/vote-system.git
cd vote-system
```

### 2. Configura la base de datos

- Crea la base de datos y las tablas necesarias (`votes`, `vote_records`, `seats`, `users`, etc.)
- Ajusta los datos de conexión en el archivo `.env` del backend

### 3. Instala dependencias

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../voting-contract
npm install
```

### 4. Configura variables de entorno

Crea un archivo `.env` en la carpeta `backend` con:

```
PORT=3000
SEPOLIA_PRIVATE_KEY=tu_clave_privada
SEPOLIA_RPC_URL=tu_url_rpc_sepolia
```

---

### 5. Despliega el contrato inteligente

1. Edita `scripts/deploy.js` si necesitas pasar parámetros al constructor.
2. Ejecuta el despliegue:

    ```bash
    cd voting-contract
    npx hardhat run scripts/deploy.js --network sepolia
    ```

3. Copia la dirección del contrato desplegado y actualízala en el backend.

---

### 6. Inicia los servidores

```bash
# En /backend
npm start

# En /frontend
npm start
```

---

## Uso

1. Conecta tu wallet mediante WalletConnect en la interfaz.
2. Presidentes pueden crear y cerrar votaciones (requiere firma).
3. Diputados pueden votar desde su escaño (requiere firma).
4. Los resultados se almacenan en blockchain y pueden consultarse públicamente.

---

## Importancia de WalletConnect

- Permite autenticación y firma segura sin contraseñas.
- Garantiza que solo los usuarios autorizados puedan votar o gestionar votaciones.
- Compatible con múltiples wallets y dispositivos.

---

##
