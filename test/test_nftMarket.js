const royaltyToken721 = artifacts.require("royaltyToken721");
const nftMarket = artifacts.require("nftMarket");
const {assert, expect} = require("chai");
const {time, constants} = require("@openzeppelin/test-helpers");
const {BN, web3}  = require("@openzeppelin/test-helpers/src/setup");


contract("RoyaltyToken721  ", function(accounts){
    describe("listItem", ()=>{
        let token;
        let market;
        before(async()=>{
            const tokenMaxSupply = 1000;

            token = await royaltyToken721.new( 
            tokenMaxSupply,
            "QmR9L46sbHbJDmyKoZezQVkdKT2w5oSwjop9JmiE8oapLe",
            web3.utils.toWei("0.1"),
            500
            )
            

            market = await nftMarket.new(
                web3.utils.toWei("0.1"),
                5,
                600,
                5
            )
        })

        it("token price should not be less than minimum listing price ", async()=>{
            try{
                await token.mintToken({value: web3.utils.toWei("0.1")});
                await market.listItem(token.address, 1, web3.utils.toWei("0.01"));
                
            }
            catch(err){
                if(err.message.includes("token price less than minimum listing price"))
                expect(true);
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });
        it("should list token on market ", async()=>{
            
                await token.mintToken({value: web3.utils.toWei("0.1")});
                let ownerBeforeList =  await token.ownerOf(1);
                await token.setApprovalForAll(market.address, true)
                await market.listItem(token.address, 1, web3.utils.toWei("0.1"));

                let ownerAfterList = await token.ownerOf(1);

                expect(ownerAfterList).to.equal(market.address)
            
        });
    })

    describe("cancel Listings", ()=>{
        let token;
        let market;
        before(async()=>{
            const tokenMaxSupply = 500;

            token = await royaltyToken721.new( 
            tokenMaxSupply,
            "QmR9L46sbHbJDmyKoZezQVkdKT2w5oSwjop9JmiE8oapLe",
            web3.utils.toWei("1"),
            500
            )
            market = await nftMarket.new(
                web3.utils.toWei("1"),
                5,
                600,
                5
            )
        })
        
        it("only lister/seller can cancel listing ", async()=>{
            try{
            await token.mintToken({value: web3.utils.toWei("1")});
            await token.setApprovalForAll(market.address, true);
            await market.listItem(token.address, 1, web3.utils.toWei("1"));
            
            await market.cancelListing(1, {from: accounts[2]});
            }
            catch(err){
                if(err.message.includes("only seller can cancel listing")){
                    expect(true);
                }
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });

        it("current listing state should be available", async()=>{
            try{
            await token.mintToken({value: web3.utils.toWei("1")});
            await token.setApprovalForAll(market.address, true);
            await market.listItem(token.address, 1, web3.utils.toWei("1"));
            await market.buyListedToken(1, {value: web3.utils.toWei("1"), from:accounts[2]});
            
            await market.cancelListing(1);
            }
            catch(err){
                if(err.message.includes("current state should be available")){
                    expect(true);
                }
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });

        it("transfer token back to lister account", async()=>{
            
            await token.mintToken({value: web3.utils.toWei("1")});
            await token.setApprovalForAll(market.address, true);
            await market.listItem(token.address, 1, web3.utils.toWei("1"));

            await market.cancelListing(1);
            let marketBalance = (await token.balanceOf(market.address)).toString();
            
            expect(marketBalance).to.equal("0");
        });

    })

    describe("buyListeItem", ()=>{
        let token;
        let market;
        before(async()=>{
            const tokenMaxSupply = 500;

            token = await royaltyToken721.new( 
            tokenMaxSupply,
            "QmR9L46sbHbJDmyKoZezQVkdKT2w5oSwjop9JmiE8oapLe",
            web3.utils.toWei("1"),
            500
            )
            
            market = await nftMarket.new(
                web3.utils.toWei("1"),
                5,
                600,
                5
            )

        })
        it("token lister cannot buy ", async()=>{
            try{
                await token.mintToken({value: web3.utils.toWei("1")});
                await token.setApprovalForAll(market.address, true)
                await market.listItem(token.address, 1, web3.utils.toWei("1"));

                await market.buyListedToken(1, {value:web3.utils.toWei("1")});
                
            }
            catch(err){
                if(err.message.includes("seller can not buy")){
                expect(true);
                }
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });

        it("token state should be available", async()=>{
            try{
                await token.mintToken({value: web3.utils.toWei("1")});
                await token.setApprovalForAll(market.address, true)
                await market.listItem(token.address, 1, web3.utils.toWei("1"));
            
                await market.buyListedToken(1, {value: web3.utils.toWei("1"),from: accounts[2]});
                await market.buyListedToken(1, {value: web3.utils.toWei("1"),from: accounts[3]});
                
            }
            catch(err){
                if(err.message.includes("token not available")){
                expect(true);
                }
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });
        
        it("insufficient payment to buy tokens ", async()=>{
            try{
                await token.mintToken({value: web3.utils.toWei("1")});
                await token.setApprovalForAll(market.address, true)
                await market.listItem(token.address, 1, web3.utils.toWei("1"));
            
                await market.buyListedToken(1, {value: web3.utils.toWei(".1"),from: accounts[2]});
                
            }
            catch(err){
                if(err.message.includes("insufficien payment"))
                expect(true);
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });

        // it("should return discount to buyer ", async()=>{

        //     await token.mintToken({value: web3.utils.toWei("1"),from:accounts[5]});
        //     await token.setApprovalForAll(market.address, true, {from:accounts[5]});
        //     await market.listItem(token.address, 1, web3.utils.toWei("1"),  {from:accounts[5]});
            
        //     await market.buyListedToken(1, {value: web3.utils.toWei("1"),from: accounts[6]});

        //     let discount = web3.utils.toWei("1")*5/100;

        //     expect(discount).to.equal(50000000000000000);
        // });

        it("market fee paid ", async()=>{

            await token.mintToken({value: web3.utils.toWei("1"),from:accounts[5]});
            await token.setApprovalForAll(market.address, true, {from:accounts[5]});
            await market.listItem(token.address, 1, web3.utils.toWei("1"),  {from:accounts[5]});
            
            await market.buyListedToken(1, {value: web3.utils.toWei("1"),from: accounts[6]});

            let balanceAfterPurchase = await web3.eth.getBalance(market.address);
            let discount = web3.utils.toWei("1")*5/100;
            let afterDiscount =(web3.utils.toWei("1"))- Number(discount);
            let royalty = (Number(afterDiscount))*5/100;
            let afterRoyalty =(afterDiscount)- Number(royalty);
            let fee = (Number(afterRoyalty))*5/100;
            let afterfee =(afterRoyalty)- Number(fee);

            expect(Number(balanceAfterPurchase)).to.equal(Number(fee));            
        });
    })
});