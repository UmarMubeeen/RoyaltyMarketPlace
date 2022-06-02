// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;


import "../node_modules/@openzeppelin/contracts/interfaces/IERC721.sol";
import "../node_modules/@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/utils/Counters.sol";

import "../node_modules/@openzeppelin/contracts/token/common/ERC2981.sol";


contract NftMarket is ReentrancyGuard{
    
    using SafeMath for uint ;
    using Counters for Counters.Counter;

    enum state{
        avaialbale,
        sold,
        cancelled
    }

    struct nftItem{
        uint itemId;
        address payable seller;
        uint tokenPrice;
        address tokenAdress;
        uint tokenId;
        state stateNow;
        uint listTime;
    }
    mapping(uint => nftItem) public nftItems;

    Counters.Counter private idCounter;
    uint public saleBasePrice;                 ///optional can be removed
    uint internal saleComissionPercent;
    address public owner;
    uint public discountTime;
    uint public discountRate;    

    constructor(uint _salePrice, uint _saleComissionPercent, uint _discountTime, uint _discountRate){

        owner = msg.sender;
        saleBasePrice = _salePrice;
        saleComissionPercent= _saleComissionPercent;
        discountTime = _discountTime;
        discountRate = _discountRate;

    }

    event itemListed(
        uint indexed itemID,
        address seller,
        uint price,
        address indexed tokenAddress,
        uint indexed tokenId,
        uint listingTime
     );
     event itemSold(
        uint itemId,
        address indexed tokenAdress,
        uint tokenId,
        uint price,
        uint commission,
        address indexed buyer,
        address indexed seller
     );
     event listingCancelled(
         uint itemId,
         address indexed seller
     );

    function listItem(IERC721 _tokenAddress, uint _tokenId, uint _price) external nonReentrant {

        require(_price >= saleBasePrice, "token price less than minimum listing price");

       ///@dev increased the counter to start id from 1
        idCounter.increment();       
        uint _itemID = idCounter.current();
        
        ///@dev transfered token to contract address
        _tokenAddress.transferFrom(msg.sender, address(this), _tokenId);
        
        ///@dev added item details in mapping against ID
        nftItems[_itemID] = nftItem(
            _itemID,
            payable(msg.sender),
            _price,
            address(_tokenAddress),
            _tokenId,
            state.avaialbale,
            block.timestamp
        ); 

    //event emitted for listing
       emit itemListed(
            _itemID,
            payable(msg.sender),
            _price,
            address(_tokenAddress),
            _tokenId,
            block.timestamp
            );
    }

    function buyListedToken(uint _itemId) external nonReentrant payable{
        nftItem storage _nftItems = nftItems[_itemId];

        require(msg.sender != _nftItems.seller , "seller can not buy");
        require(_nftItems.stateNow == state.avaialbale, "token not available");
        require(msg.value == _nftItems.tokenPrice, "insufficien payment");

        uint _marketCommission;
        uint _discountAmount; 
        uint _royalty;
        uint _netSaleAmount;
        address _nftCreator;
        uint _amountAfterRoyalty;
        uint _amountAfterDiscount;

        if(block.timestamp <= (_nftItems.listTime + discountTime)){        

            ///@dev calculate discount amount on payment and netamount after deductiing discount
            (_discountAmount, _amountAfterDiscount) = _getValues(msg.value, discountRate);

            ///@dev calculate the royalty of creator and amount after deducting royalty;
            (_nftCreator,_royalty, _amountAfterRoyalty) = _getRoyalty(_itemId, _amountAfterDiscount); 
        }
        else{

             ///@dev calculate the royalty of creator and amount after deducting royalty;
            (_nftCreator,_royalty, _amountAfterRoyalty) = _getRoyalty(_itemId, msg.value);  
        }

        ///dev calculate commision amount and net sale amount
        (_marketCommission, _netSaleAmount) = _getValues(_amountAfterRoyalty, saleComissionPercent);

        ///@dev transfer royality to nft creator;
        payable(_nftCreator).transfer(_royalty);

        ///@dev transfer discount amount to buyer
        payable(msg.sender).transfer(_discountAmount);

        ///@dev transfer net sale amount after discount and commission to seller
        _nftItems.seller.transfer(_netSaleAmount);

        ///@dev set current status of token to sold
        _nftItems.stateNow = state.sold;

        ///@dev token transfered to buyer account from contract address
        IERC721(_nftItems.tokenAdress).transferFrom(address(this), msg.sender, _nftItems.tokenId);

       emit itemSold(
            _itemId,
            address(_nftItems.tokenAdress),
            _nftItems.tokenId,
             _nftItems.tokenPrice,
            _marketCommission,
            msg.sender,
            _nftItems.seller
            );
    }

    function cancelListing(uint _itemId) external{

        nftItem memory _nftItem = nftItems[_itemId];

        require(msg.sender ==_nftItem.seller, "only seller can cancel listing");
        require(_nftItem.stateNow == state.avaialbale, "current state should be available");

        _nftItem.stateNow = state.cancelled;

        ///@dev transfer token back to seller from market account
        IERC721(_nftItem.tokenAdress).transferFrom(address(this), msg.sender, _itemId);

        emit listingCancelled(_itemId, msg.sender); 
    }
    

    function getListedItem(uint _itemid) public view returns(nftItem memory){
        return nftItems[_itemid];
    }

    function getPrice(uint _tokenId) public view returns (uint){
        
       return  nftItems[_tokenId].tokenPrice;
    }

    function _calculatePercent(uint _payment, uint _percent) internal pure returns(uint){
        
        uint _percentageAmount = (_payment.mul(_percent)).div(100);
        return _percentageAmount;
        
    }
    function _getValues(uint _value, uint _setPercentage) internal pure returns(uint, uint ){
       
        uint _percentageAmount = _calculatePercent(_value, _setPercentage);
        uint _amountAfterPercentage = (_value).sub(_percentageAmount);

        return (_percentageAmount, _amountAfterPercentage);
    }

    function _getRoyalty(uint _itemId, uint _amount) internal view returns(address,uint ,uint){

        nftItem storage _nftItems = nftItems[_itemId];

        (address _nftCreator, uint _royalty) = ERC2981(_nftItems.tokenAdress).royaltyInfo(_itemId,_amount);
        uint _amountAfterRoyalty = _amount.sub(_royalty);

        return(_nftCreator,_royalty, _amountAfterRoyalty );
    } 
   

}