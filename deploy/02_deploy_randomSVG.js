const { ethers } = require('hardhat')
let { networkConfig } = require('../helper-hardhat-config')

module.exports = async ({
    getNamedAccounts,
    deployments,
    getChainId
}) => {
    const { deploy, get, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = await getChainId()

    //if on local, we gotta deploy a fake link token else use the real one
    let linkTokenAddress
    let vrfCoordinatorAddress
    if (chainId == 31337) {
        //means we are on a local chain
        let linkToken = await get('LinkToken')
        linkTokenAddress = linkToken.address
        let vrfCoordinatorMock = await get('VRFCoordinatorMock')
        vrfCoordinatorAddress = vrfCoordinatorMock.address
    } else {
        linkTokenAddress = networkConfig[chainId]['linkToken']
        vrfCoordinatorAddress = networkConfig[chainId]['vrfCoordinator']
    }
    const keyHash = networkConfig[chainId]['keyHash']
    const fee = networkConfig[chainId]['fee']
    let args = [vrfCoordinatorAddress, linkTokenAddress, keyHash, fee]
    log("-------------------------------------------")
    const RandomSVG = await deploy("RandomSVG", {
        from: deployer,
        args: args,
        log: true
    })

    const networkName = networkConfig[chainId]["name"]
    log(`Verify with: \n npx hardhat verify --network ${networkName} ${RandomSVG.address} ${args.toString().replace(/,/g, " ")}`)

    //fund with LINK
    const linkTokenContract = await ethers.getContractFactory("LinkToken")
    const accounts = await hre.ethers.getSigners()
    const signer = accounts[0]
    const linkToken = new ethers.Contract(linkTokenAddress, linkTokenContract.interface, signer)
    let fund_tx = await linkToken.transfer(RandomSVG.address, '3000000000000000000')
    await fund_tx.wait(1)

    //create nft
    const RandomSVGContract = await ethers.getContractFactory("RandomSVG")
    const randomSVG = new ethers.Contract(RandomSVG.address, RandomSVGContract.interface, signer)
    for (let index = 0; index < 100; index++) {
        log(`Creating NFT number ${index}`)
        let tx = await randomSVG.create({ gasLimit: 300000 })
        let receipt = await tx.wait(1)
        let tokenId = receipt.events[3].topics[2]
        log(`You've made your NFT!! This is token number ${tokenId.toString()}`)
        log(`Let's wait for the ChainLink node to respond`)
        if (chainId != 31337) {
            await new Promise(r => setTimeout(r, 180000))
            log(`Lets finish the mint....`)
            let finish_tx = await randomSVG.finishMint(tokenId, { gasLimit: 2000000 })
            await finish_tx.wait(1)
            log(`You can view the tokenURI here ${await randomSVG.tokenURI(tokenId)}`)
        } else {
            const VRFCoordinatorMock = await deployments.get("VRFCoordinatorMock")
            vrfCoordinator = await ethers.getContractAt("VRFCoordinatorMock", VRFCoordinatorMock.address, signer)
            let vrf_tx = await vrfCoordinator.callBackWithRandomness(receipt.logs[3].topics[1], 12328162, randomSVG.address)
            await vrf_tx.wait(1)
            log("Now let's finish the mint!")
            let finish_tx = await randomSVG.finishMint(tokenId, { gasLimit: 2000000 })
            await finish_tx.wait(1)
            log(`You can view the tokenUri here ${await randomSVG.tokenURI(tokenId)}`)

            //events==log
        }
    }
}

module.exports.tags = ['all', 'rsvg']