const royaltyToken721 = artifacts.require("royaltyToken721");
const nftMarket = artifacts.require("nftMarket");
const {assert, expect} = require("chai");
const {time, constants} = require("@openzeppelin/test-helpers");
const {BN, web3}  = require("@openzeppelin/test-helpers/src/setup");


contract("NFT Market", function(accounts){
    describe("mintToken", ()=>{
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
            

            let currentTime = await time.latest();
            let discountTime = currentTime.add(time.duration.minutes(10));
            market = await nftMarket.new(
                web3.utils.toWei("0.1"),
                5,
                discountTime,
                5
            )

        })
        it("sent payment should be equal to token price", async()=>{
            try{
                await token.mintToken({value: web3.utils.toWei("0.01")});
            }
            catch(err){
                if(err.message.includes("payment not equal to token price"))
                expect(true);
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });

        it("set royalty ", async()=>{
            
            await token.mintToken({value: web3.utils.toWei("0.1")});
            let _royalty = await token.royaltyInfo(1, web3.utils.toWei("0.1"));
            if(_royalty != 5000000000000000)
                expect(true);
            else{
                
                expect(false);
            }
            
        });

        // it.only("should reject token mint call from address(0)", async()=>{
        //     try{
        //         await token.mintToken({value: web3.utils.toWei("0.01"), from: constants.ZERO_ADDRESS});
        //     }
        //     catch(err){

        //         if(err.message.includes("Invalid address(0)"))
        //         expect(true);
                
        //         else{
        //             console.log("error!:", err.message);
        //             expect(false);
        //         }
        //     }
        // });
    })

    describe("mintToken", ()=>{
        let token;
        let market;
        let balance;
        before(async()=>{
            const tokenMaxSupply = 2;

            token = await royaltyToken721.new( 
            tokenMaxSupply,
            "QmR9L46sbHbJDmyKoZezQVkdKT2w5oSwjop9JmiE8oapLe",
            web3.utils.toWei("0.1"),
            500
            )
            

            let currentTime = await time.latest();
            let discountTime = currentTime.add(time.duration.minutes(10));
            market = await nftMarket.new(
                web3.utils.toWei("0.1"),
                5,
                discountTime,
                5
            )

        })
        it("token supply should not exceed the maxSupply ", async()=>{
            try{
                await token.mintToken({value: web3.utils.toWei("0.1")});
                await token.mintToken({value: web3.utils.toWei("0.1")});
                await token.mintToken({value: web3.utils.toWei("0.1")});
            }
            catch(err){
                if(err.message.includes("maximum Supply limit reached"))
                expect(true);
                else{
                    console.log("error!:", err.message);
                    expect(false);
                }
            }
        });
        

    })          
 }) 