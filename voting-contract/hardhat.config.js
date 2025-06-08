require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
	    url: "https://sepolia.infura.io/v3/c2b67cc2cfa74009ae8c8b1392498971", // pon aquí tu URL de Infura o Alchemy
      accounts: ["842a0f90c9ce27bd753d2302c2ec7e7476220cbae0f29d3679e6c3f2023a9924"] // pon aquí tu private key sin el prefijo 0x
    }
  }
};
