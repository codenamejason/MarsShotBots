/* eslint-disable no-use-before-define */
// deploy/00_deploy_your_contract.js

// const { config, ethers, tenderly, run } = require("hardhat");
// const chalk = require("chalk");
const uris = require("../uris.json");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("MarsShotBots", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    // args: [uris],
    log: true,
  });

  /*
    - Getting a previously deployed contract
    const YourContract = await ethers.getContract("YourContract", deployer);
    await YourContract.setPurpose("Hello");
    - To take ownership of yourContract using the ownable library uncomment next line and add the 
    - address you want to be the owner. 
    yourContract.transferOwnership(YOUR_ADDRESS_HERE);
  */
};

module.exports.tags = ["MarsShotBots"];
