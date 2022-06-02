// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;


import "../node_modules/@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "../node_modules/@openzeppelin/contracts/token/common/ERC2981.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";


contract RoyaltyToken721 is ERC721URIStorage,ERC2981, Ownable {
    using SafeMath for uint ;
    using Counters for Counters.Counter;

    Counters.Counter private tokenIdCounter;

    uint public maxSupply;
    string private URI;
    uint public tokenPrice;
    uint96 internal royaltyRate;

    constructor(uint _maxSupply, string memory _URI, uint _tokenPrice, uint96 _royaltyRate) ERC721("RoyalityToken721", "Royal21"){

        require(owner() != address(0), "owner cannot be address(0)" );
        maxSupply = _maxSupply;
        URI = _URI;
        tokenPrice = _tokenPrice;
        royaltyRate =_royaltyRate;
    }
     ////@note also possible to pass URI as argument;
    function mintToken() external payable{
        
        require(msg.sender != address(0), "Invalid address(0)");    // canot mint to address 0
        require(msg.value == tokenPrice, "payment not equal to token price");
        
        tokenIdCounter.increment();         //token id start from 1
        uint tokenId = tokenIdCounter.current();  

        require(!_exists(tokenId), "Token already minted");    //check if token already minted 
        require(tokenId <= maxSupply, "maximum Supply limit reached");  //maximum total supply cannot exceed the max-Supply limit

        _mint(msg.sender, tokenId);          //mint token to given address

        ///@dev setting up tokn uri
        _setTokenURI(tokenId, URI);

        ///@dev setting up royalty for creator
         _setTokenRoyalty(tokenId, owner(), royaltyRate);
    }


    
   



    /// manually override parent contract function due to name clash 
    function _beforeTokenTransfer(
        address from, 
        address to, 
        uint256 tokenId) internal override(ERC721){
        super._beforeTokenTransfer(from, to , tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override (ERC721,ERC2981)returns (bool){
       return super.supportsInterface(interfaceId);
    }



}