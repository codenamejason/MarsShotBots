/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: '127.0.0.1', port: '5001', protocol: 'http' })

const main = async () => {

  let allAssets = {}


async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

  console.log("\n\n Loading artwork.json...\n");
  const artwork = JSON.parse(fs.readFileSync("../../artwork.json").toString())

  const pngList = ['Abrupt_Memory.png',
  'Acidic_Programmer.png',
  'Adorable_Unix.png',
  'Agitated_App.png',
  'Alert_Desktop.png',
  'Amiable_Queue.png',
  'Annoyed_Javascript.png',
  'Annoyed_Table.png',
  'Antsy_Security.png',
  'Appalling_UI.png',
  'Appetizing_IP.png',
  'Appetizing_Media.png',
  'Apprehensive_Virtual.png',
  'Arrogant_Javascript.png',
  'Ashamed_Disk.png',
  'Ashamed_Website.png',
  'Average_Debug.png',
  'Batty_Cookie.png',
  'Beefy_Html.png',
  'Biting_Encryption.png',
  'Bitter_Dot_matrix.png',
  'Bland_Network.png',
  'Blushing_Firewall.png',
  'Brave_Search.png',
  'Charming_Dot.png',
  'Cheeky_User.png',
  'Cheerful_Command.png',
  'Chubby_Bit.png',
  'Clean_Dynamic.png',
  'Clear_Algorithm.png',
  'Clear_Pop-up.png',
  'Cloudy_Macintosh.png',
  'Clumsy_Cd-rom.png',
  'Colorful_Platform.png',
  'Colossal_Macintosh.png',
  'Combative_Internet.png',
  'Comfortable_Encryption.png',
  'Condemned_Script.png',
  'Condescending_Thread.png',
  'Contemplative_Clip_Board.png',
  'Convoluted_Xml.png',
  'Corny_Data.png',
  'Corny_Log_Out.png',
  'Courageous_Program.png',
  'Creepy_Firmware.png',
  'Crooked_Dashboard.png',
  'Crooked_Worm.png',
  'Cruel_Memory.png',
  'Cumbersome_Bus.png',
  'Cynical_Screenshot.png',
  'Cynical_Virtual_Memory.png',
  'Dangerous_Cookie.png',
  'Decayed_Utility.png',
  'Deep_Keyboard.png',
  'Delicious_Dvd.png',
  'Depraved_Cache.png',
  'Depraved_Net.png',
  'Depressed_Malware.png',
  'Disgusted_Frame.png',
  'Disgusted_Password.png',
  'Distinct_User.png',
  'Distraught_Cyberspace.png',
  'Distressed_Flaming.png',
  'Disturbed_Hyperlink.png',
  'Disturbed_Keyboard.png',
  'Drab_Command.png',
  'Drained_Format.png',
  'Drained_Key.png',
  'Ecstatic_Logic.png',
  'Elated_Page.png',
  'Emaciated_Log_Out.png',
  'Encouraging_Algorithm.png',
  'Energetic_Joystick.png',
  'Enthusiastic_Network.png',
  'Envious_Client.png',
  'Envious_Malware.png',
  'Exasperated_Login.png',
  'Excited_Operating_System.png',
  'Exhilarated_Snapshot.png',
  'Extensive_Social_Networking.png',
  'Fancy_Configure.png',
  'Fantastic_Screenshot.png',
  'Fierce_Protocol.png',
  'Filthy_Compress.png',
  'Flat_Bite.png',
  'Flat_Template.png',
  'Floppy_Bug.png',
  'Fluttering_Algorithm.png',
  'Fluttering_Cypherpunk.png',
  'Fluttering_Virtual.png',
  'Foolish_Fax.png',
  'Foolish_Keyword.png',
  'Foolish_Wiki.png',
  'Frantic_Online.png',
  'Frantic_Workstation.png',
  'Fresh_Web_Host.png',
  'Friendly_Dvd.png',
  'Friendly_Keyboard.png',
  'Friendly_Spam.png',
  'Frightened_File.png',
  'Frightened_Node.png',
  'Frothy_Kernel.png',
  'Frustrating_Hyperlink.png',
  'Fuzzy_Desktop.png',
  'Fuzzy_Upload.png',
  'Gaudy_Typeface.png',
  'Ghastly_Analog.png',
  'Giddy_Java.png',
  'Giddy_Storage.png',
  'Gigantic_Emoticon.png',
  'Gigantic_Script.png',
  'Glamorous_Frame.png',
  'Gleaming_Cd.png',
  'Gleaming_Dns_.png',
  'Gleaming_Program.png',
  'Glorious_Page.png',
  'Gorgeous_Flash.png',
  'Gorgeous_Shift_Key.png',
  'Graceful_Motherboard.png',
  'Graceful_Web.png',
  'Greasy_Hypertext.png',
  'Greasy_Text_Editor.png',
  'Grieving_Delete.png',
  'Gritty_Dashboard.png',
  'Gritty_Screen.png',
  'Grubby_Spyware.png',
  'Grumpy_Drag.png',
  'Grumpy_Path.png',
  'Grumpy_Url.png',
  'Handsome_UI.png',
  'Happy_Cd.png',
  'Happy_Operating_System.png',
  'Happy_Www.png',
  'Healthy_Virtual.png',
  'Helpful_Domain.png',
  'Helpful_Multimedia.png',
  'Helpless_Bite.png',
  'Helpless_Linux.png',
  'High_Cybercrime.png',
  'High_Plug-in.png',
  'Hollow_Domain_Name.png',
  'Hollow_Java.png',
  'Hollow_Pop-up.png',
  'Homely_Multimedia.png',
  'Horrific_Frame.png',
  'Huge_Encryption.png',
  'Hungry_Modem.png',
  'Hurt_Www.png',
  'Ideal_Binary.png',
  'Ideal_Logic.png',
  'Immense_Cypherpunk.png',
  'Immense_Reboot.png',
  'Impressionable_Desktop.png',
  'Intrigued_Save.png',
  'Intrigued_Wireless.png',
  'Irate_Bitmap.png',
  'Irate_Trojan_Horse.png',
  'Irritable_Screenshot.png',
  'Itchy_Path.png',
  'Itchy_Screen.png',
  'Jealous_Clip_Art.png',
  'Jealous_Keyboard.png',
  'Jittery_Runtime.png',
  'Jolly_Clip_Art.png',
  'Jolly_Scroll_Bar.png',
  'Joyous_Hyperlink.png',
  'Joyous_Storage.png',
  'Joyous_Widget.png',
  'Jumpy_Trojan_Horse.png',
  'Kind_Scroll.png',
  'Lackadaisical_Utility.png',
  'Lazy_Cd.png',
  'Little_Queue.png',
  'Little_Shareware.png',
  'Lively_Boot.png',
  'Lively_Scroll.png',
  'Loose_App.png',
  'Lovely_Linux.png',
  'Lucky_Memory.png',
  'Ludicrous_Storage.png',
  'Macho_Domain_Name.png',
  'Magnificent_Status_Bar.png',
  'Maniacal_Bitmap.png',
  'Massive_Iteration.png',
  'Melancholy_Decompress.png',
  'Miniature_File.png',
  'Miniature_Tag.png',
  'Minute_Process.png',
  'Minute_Www.png',
  'Mortified_Graphics.png',
  'Motionless_Email.png',
  'Muddy_Modem.png',
  'Nasty_Array.png',
  'Nonchalant_Hacker.png',
  'Nutritious_Scroll_Bar.png',
  'Obedient_Page.png',
  'Oblivious_Network.png',
  'Obnoxious_Host.png',
  'Odd_Flowchart.png',
  'Odd_Scanner.png',
  'Old-fashioned_Icon.png',
  'Outrageous_Captcha.png',
  'Outrageous_Inbox.png',
  'Panicky_UI.png',
  'Perfect_Router.png',
  'Petite_Firmware.png',
  'Plain_Email.png',
  'Pleasant_Wireless.png',
  'Precious_Software.png',
  'Prickly_Spam.png',
  'Puny_Web.png',
  'Quizzical_Script.png',
  'Reassured_Kernel.png',
  'Reassured_Net.png',
  'Ripe_Print.png',
  'Rotten_Document.png',
  'Rough_Ram.png',
  'Rough_Utility.png',
  'Round_Real-time.png',
  'Scant_Array.png',
  'Scary_Computer.png',
  'Scary_Scan.png',
  'Scattered_Dvd.png',
  'Scrawny_Bug.png',
  'Selfish_Dns_.png',
  'Selfish_Word_Processor.png',
  'Shallow_Fax.png',
  'Shiny_Podcast.png',
  'Silky_Document.png',
  'Skinny_Buffer.png',
  'Slimy_Backup.png',
  'Slimy_Protocol.png',
  'Slippery_Dot.png',
  'Small_Configure.png',
  'Small_Flaming.png',
  'Smiling_Folder.png',
  'Smoggy_Caps_Lock.png',
  'Smoggy_Monitor.png',
  'Smooth_Buffer.png',
  'Smug_Graphics.png',
  'Smug_Upload.png',
  'Soggy_Security.png',
  'Soggy_Virtual_Memory.png',
  'Solid_Qwerty.png',
  'Sour_Privacy.png',
  'Sparkling_Exabyte.png',
  'Spicy_Graphics.png',
  'Spicy_Path.png',
  'Spotless_Net.png',
  'Spotless_Workstation.png',
  'Stale_Multimedia.png',
  'Steady_File.png',
  'Stout_App.png',
  'Stout_Gigabyte.png',
  'Strange_Scroll_Bar.png',
  'Strong_Flash.png',
  'Substantial_Algorithm.png',
  'Successful_Screen.png',
  'Superficial_Lurking.png',
  'Superficial_Open_Source.png',
  'Swanky_Drag.png',
  'Sweet_IP.png',
  'Tart_Social_Networking.png',
  'Tasty_Document.png',
  'Tasty_Login.png',
  'Tender_Byte.png',
  'Tense_Open_Source.png',
  'Terrible_Table.png',
  'Thoughtless_Page.png',
  'Tight_Integer.png',
  'Timely_Host.png',
  'Timely_Queue.png',
  'Tricky_Integer.png',
  'Tricky_Pirate.png',
  'Trite_Option.png',
  'Troubled_Screen.png',
  'Uneven_Dvd.png',
  'Unsightly_Computer.png',
  'Unsightly_Mainframe.png',
  'Uptight_Graphics.png',
  'Vast_Caps_Lock.png',
  'Victorious_Integer.png',
  'Victorious_Reboot.png',
  'Vivacious_Log_Out.png',
  'Vivacious_Xml.png',
  'Weary_Process.png',
  'Whimsical_Delete.png',
  'Whimsical_Portal.png',
  'Whopping_Emoticon.png',
  'Witty_Gigabyte.png',
  'Witty_Window.png',
  'Wonderful_Command.png',
  'Zany_Runtime.png',
  'Zealous_Notebook_Computer.png',
  'Zealous_Shift_Key.png',
  'Zippy_Online.png',
  'Zippy_Screen.png']

  for (let x in pngList) {
    console.log('pulling')
    fs.copyFile(`../react-app/botimgs/${pngList[x]}`, `../react-app/splitimgs/${pngList[x]}`, (err) => {
      if (err) 
          throw err;
      console.log('source.txt was copied to destination.txt');
  });

  //`../react-app/botimgs/${pngList[x]}`
  }

  
  /* for(var a = 0; a < artwork.length; a += 2){
    //(a; a += 2;) //Add two to i every iteration
      console.log("  Uploading "+artwork[a].name+"...")
      const stringJSON = JSON.stringify(artwork[a])
      console.log("creating json files")
      let scoredNames = artwork[a].name.replace(/ /g,"_")
      let removeMars = scoredNames.replace(/_Mars_Shot_Bot/g,"")
      fs.writeFileSync(`../react-app/jsons/${removeMars}.json`, stringJSON)
      //sleep(1000)
      const uploaded = await ipfs.add(stringJSON)
      console.log("   "+artwork[a].name+" ipfs:",uploaded.path)
      allAssets[uploaded.path] = artwork[a]  */
  //}
  //}

  /* console.log("\n Injecting assets into the frontend...")
  const finalAssetFile = "export default "+JSON.stringify(allAssets)+""
  fs.writeFileSync("../react-app/src/assets.js",finalAssetFile)
  fs.writeFileSync("./uploaded.json",JSON.stringify(allAssets)) */



  /*
  //If you want to send value to an address from the deployer
  const deployerWallet = ethers.provider.getSigner()
  await deployerWallet.sendTransaction({
    to: "0x34aA3F359A9D614239015126635CE7732c18fDF3",
    value: ethers.utils.parseEther("0.001")
  })
  */


  /*
  //If you want to send some ETH to a contract on deploy (make your constructor payable!)
  const yourContract = await deploy("YourContract", [], {
  value: ethers.utils.parseEther("0.05")
  });
  */


  /*
  //If you want to link a library into your contract:
  // reference: https://github.com/austintgriffith/scaffold-eth/blob/using-libraries-example/packages/hardhat/scripts/deploy.js#L19
  const yourContract = await deploy("YourContract", [], {}, {
   LibraryName: **LibraryAddress**
  });
  */

};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });