const RoyaltyToken721 = artifacts.require("RoyaltyToken721");
const NftMarket = artifacts.require("NftMarket");

module.exports = async function (deployer) {

  let _uri = "https://ipfs.io/ipfs/Qmasr86Ey2HbqcugxJAESHVSGdpNUtAyN87cVA4z9Jknt5/"; 
  ///@dev deployed token with required parameters
  await  deployer.deploy(RoyaltyToken721, 1000, _uri, web3.utils.toWei("0.001"), 500);

  const {timestamp} = await web3.eth.getBlock("latest");
  ///@dev deployed market contarct 
  await deployer.deploy(NftMarket, web3.utils.toWei("0.001"), 5, 600, 5);
}