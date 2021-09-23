pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MarsShotBots is ERC721, Ownable {

  address payable public constant gitcoin = 0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6;

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  string [] private uris;

  constructor() public ERC721("MarsShotBots", "MARS") {
    _setBaseURI("https://forgottenbots.mypinata.cloud/ipfs/QmRbyRtJ7TzCGusaYd8qYEFybuj4ZNhay1sNowrDAXF4K4/");
    uris = ['Adelyn.json','Adler.json','Ahmir.json','Alaya.json','Albert.json','Alden.json','Alessandro.json','Alex.json','Alexis.json','Alia.json','Alyssa.json','Amora.json','Anakin.json','Angelina.json','Annabella.json','Ariel.json','Ariyah.json','Arthur.json','Axl.json','Axton.json','Belen.json','Braden.json','Bradley.json','Brecken.json','Brinley.json','Brynlee.json','Cairo.json','Cal.json','Callan.json','Cameron.json','Cannon.json','Carlos.json','Carly.json','Case.json','Casen.json','Cayson.json','Cesar.json','Charlie.json','Claire.json','Clark.json','Clementine.json','Coen.json','Corey.json','Dakari.json','Dallas.json','Daniel.json','Danielle.json','Danny.json','Darwin.json','Davis.json','Daxton.json','Della.json','Dominic.json','Donald.json','Dorian.json','Dream.json','Edwin.json','Elaine.json','Eliana.json','Elianna.json','Elizabeth.json','Elliana.json','Ellianna.json','Elyse.json','Evan.json','Evangeline.json','Eve.json','Everett.json','Evie.json','Fallon.json','Finley.json','Gary.json','Georgia.json','Grace.json','Halo.json','Hana.json','Hanna.json','Hannah.json','Harlow.json','Harmony.json','Hope.json','Ian.json','Ibrahim.json','Indie.json','Israel.json','Izaiah.json','Jake.json','Jalen.json','Jase.json','Jaxtyn.json','Jay.json','Jeffrey.json','Jianna.json','Jude.json','Judith.json','Julian.json','Julio.json','Kade.json','Kairi.json','Kamari.json','Kareem.json','Kash.json','Kashton.json','Kayson.json','Khaleesi.json','Killian.json','Kolton.json','Kora.json','Lainey.json','Laurel.json','Layton.json','Leandro.json','Leonard.json','Lexie.json','Liana.json','Liliana.json','Linda.json','Liv.json','Lucca.json','Luciana.json','Madisyn.json','Makenna.json','Malaya.json','Marcos.json','Marianna.json','Marleigh.json','Mateo.json','Maxwell.json','Mckinley.json','Melissa.json','Meredith.json','Michael.json','Milana.json','Mohammad.json','Molly.json','Myles.json','Nathanael.json','Nellie.json','Nicholas.json','Niko.json','Oaklyn.json','Oaklynn.json','Paisley.json','Parker.json','Paul.json','Penelope.json','Peter.json','Presley.json','Quinn.json','Quinton.json','Raven.json','Rhea.json','Rhett.json','Rhys.json','Rosemary.json','Royal.json','Ryan.json','Ryann.json','Saoirse.json','Sincere.json','Skye.json','Solomon.json','Steven.json','Talon.json','Taylor.json','Tessa.json','Theo.json','Tomas.json','Ty.json','Tyler.json','Van.json','Walter.json','Watson.json','Westin.json','Ximena.json','Yousef.json','Zainab.json','Zelda.json','Zola.json'];
  }

  uint256 public constant limit = 179;
  uint256 public price = 0.0033 ether;

  function mintItem(address to, string memory tokenURI)
      private
      returns (uint256)
  {
      require( _tokenIds.current() < limit , "DONE MINTING");
      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(to, id);
      _setTokenURI(id, tokenURI);

      return id;
  }

  function requestMint(address to)
      public
      payable
  {
    require( msg.value >= price, "NOT ENOUGH");
    price = (price * 1040) / 1000;
    (bool success,) = gitcoin.call{value:msg.value}("");
    require( success, "could not send");
    mintItem(to, uris[_tokenIds.current()]);
  }
}
