const RoyaltyToken721 = artifacts.require("RoyaltyToken721");
const NftMarket = artifacts.require("NftMarket");

module.exports = async function (deployer) {

  ///@dev deployed token with required parameters
 await  deployer.deploy(RoyaltyToken721, 1000, "QmR9L46sbHbJDmyKoZezQVkdKT2w5oSwjop9JmiE8oapLe", web3.utils.toWei(".001"), 300);

  const {timestamp} = await web3.eth.getBlock("latest");
  ///@dev deployed market contarct 
  await deployer.deploy(NftMarket, web3.utils.toWei(".001"), 5, 600, 5);
};
