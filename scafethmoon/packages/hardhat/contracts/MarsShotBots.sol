pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MarsShotBots is ERC721 {
    address payable public constant gitcoin = 0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string[] private uris;

    constructor(string[] memory _uris) public ERC721("MarsShotBots", "MARS") {
        _setBaseURI(
            "https://forgottenbots.mypinata.cloud/ipfs/QmWgxyHPXvveciXBfNF4Y5fswmfYvhPfNfGdYNRXgZPo5f/"
        );

        uris = _uris;
    }

    uint256 public constant limit = 502;
    uint256 public price = 0.0033 ether;
    uint256 public constant mintLimit = 5;
    mapping(address => uint256) public mintLimitForUsers;

    /// Internal function to mint a new Marsbot NFT
    /// The newly minted NFT id
    function mintItem(address to, string memory tokenURI)
        private
        returns (uint256)
    {
        require(_tokenIds.current() <= limit, "DONE MINTING BOTS");
        _tokenIds.increment();

        uint256 id = _tokenIds.current();
        _mint(to, id);
        _setTokenURI(id, tokenURI);

        return id;
    }

    /// Publically exposed function to mint a new Marsbot NFT
    /// The newly minted NFT id
    function requestMint() public payable returns (uint256) {
        require(
            mintLimitForUsers[msg.sender] < mintLimit,
            "Each address may only mint five bots");

        mintLimitForUsers[msg.sender] = mintLimitForUsers[msg.sender].add(1);
        require(msg.value >= price, "NOT ENOUGH");

        // update price for next mint
        price = (price * 1015) / 1000;
        (bool success, ) = gitcoin.call{value: msg.value}("");
        require(success, "could not send");
        uint256 id = mintItem(msg.sender, uris[_tokenIds.current()]);

        return id;
    }
}
