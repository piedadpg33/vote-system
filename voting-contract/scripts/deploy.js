async function main() {
  const VotingResults = await ethers.getContractFactory("VotingResults");
  const contract = await VotingResults.deploy();
  await contract.waitForDeployment();
  console.log("VotingResults deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
