const fs = require("fs");
const { networkConfig } = require("../helper-hardhat-config");
module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    log("----------------------------------------------------")
    const SVGNFT = await deploy("SVGNFT", {
        from: deployer,
        log: true
    })
    log(`You have deployed an NFT contract to ${SVGNFT.address}`)
    let filepath = "./img/triangle.svg"
    let svg = fs.readFileSync(filepath, { encoding: "utf8" })
    const svgNFTContract = await ethers.getContractFactory("SVGNFT")
    const accounts = await hre.ethers.getSigners()
    const signer = accounts[0]
    const svgNFT = new ethers.Contract(SVGNFT.address, svgNFTContract.interface, signer)
    const networkName = networkConfig[chainId]['name']
    log(`Verify with: \n npx hardhat verify --network ${networkName} ${svgNFT.address}`)
    let tx = await svgNFT.create(svg)
    let receipt = await tx.wait(1)
    log(`You've made an NFT`);
    log(`You can view the tokenURI here ${await svgNFT.tokenURI(0)}`)
}

module.exports.tags = ['all', 'svg']