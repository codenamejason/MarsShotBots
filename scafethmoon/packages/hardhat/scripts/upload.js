/* eslint no-use-before-define: "warn" */
//import { colord, extend } from "colord";
//import namesPlugin from "colord/plugins/names";
//const {colord, extend} = require("colord");
//const {namesPlugin} = require("colord/plugins/names");
const fs = require("fs");
const ntc = require('ntcjs');
const Coloraze = require('coloraze');
const chalk = require("chalk");
const { config, ethers } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const ipfsAPI = require('ipfs-http-client');
//const ColorThief = require('colorthief');
//const mergeImages = require('merge-images');
const { getColorFromURL } = require('color-thief-node');
//const { ntc } = require('ntc');
const { Canvas, Image } = require('canvas');
const { resolve } = require("path");
const ipfs = ipfsAPI({host: '127.0.0.1', port: '5001', protocol: 'http' })
const coloraze = new Coloraze();

var rgb2hex = require('rgb2hex');

const main = async () => {

  let allAssets = {}

  for(let a in artwork){
    console.log("  Uploading "+artwork[a].name+"...")
    const stringJSON = JSON.stringify(artwork[a])
    console.log("creating json files")
    //let scoredNames = artwork[a].name.replace(/ /g,"_")
    //let removeMars = scoredNames.replace(/_Mars_Shot_Bot/g,"")
    //fs.writeFileSync(`../react-app/finaljsons/${removeMars}.json`, stringJSON)}}
    //sleep(1000)
    const uploaded = await ipfs.add(stringJSON)
    console.log("   "+artwork[a].name+" ipfs:",uploaded.path)
    allAssets[uploaded.path] = artwork[a]}}

/* 
  const filesources = ['Abrupt_Memory.png',
  'Acidic_Debug.png',
  'Acidic_Programmer.png',
  'Adorable_Laptop.png',
  'Adorable_Unix.png',
  'Adventurous_Network.png',
  'Agitated_App.png',
  'Agitated_Root.png',
  'Alert_Desktop.png',
  'Aloof_Database.png',
  'Amiable_Queue.png',
  'Annoyed_Command.png',
  'Annoyed_Restore.png',
  'Annoyed_Table.png',
  'Antsy_Protocol.png',
  'Antsy_Security.png',
  'Appalling_Java.png',
  'Appalling_Worm.png',
  'Appetizing_Link.png',
  'Appetizing_Media.png',
  'Appetizing_Podcast.png',
  'Apprehensive_Virtual.png',
  'Arrogant_Compress.png',
  'Arrogant_Flash.png',
  'Ashamed_Disk.png',
  'Ashamed_Net.png',
  'Ashamed_Website.png',
  'Attractive_Workstation.png',
  'Average_Debug.png',
  'Batty_Blog.png',
  'Batty_Cookie.png',
  'Batty_Email.png',
  'Beefy_Html.png',
  'Beefy_Virtual.png',
  'Biting_Encryption.png',
  'Biting_Link.png',
  'Bitter_Dot_matrix.png',
  'Bitter_Hardware.png',
  'Bland_Network.png',
  'Blushing_Firewall.png',
  'Bright_Spreadsheet.png',
  'Charming_Dot.png',
  'Charming_Storage.png',
  'Cheeky_User.png',
  'Cheeky_Wireless.png',
  'Cheerful_Command.png',
  'Cheerful_Hacker.png',
  'Chubby_Bit.png',
  'Chubby_Enter.png',
  'Clean_Dynamic.png',
  'Clean_Process.png',
  'Clear_Algorithm.png',
  'Clear_Encrypt.png',
  'Clear_Pop-up.png',
  'Cloudy_Macintosh.png',
  'Clueless_Email.png',
  'Clumsy_Cd-rom.png',
  'Clumsy_Username.png',
  'Colorful_Platform.png',
  'Colossal_Joystick.png',
  'Colossal_Macintosh.png',
  'Colossal_Script.png',
  'Combative_Internet.png',
  'Combative_Screen.png',
  'Comfortable_Encryption.png',
  'Condemned_Script.png',
  'Condescending_Thread.png',
  'Contemplative_Password.png',
  'Convoluted_Xml.png',
  'Cooperative_Binary.png',
  'Corny_Data.png',
  'Corny_Enter.png',
  'Costly_Spam.png',
  'Courageous_Program.png',
  'Courageous_Snapshot.png',
  'Creepy_Firmware.png',
  'Creepy_Portal.png',
  'Crooked_Dashboard.png',
  'Crooked_Download.png',
  'Crooked_Worm.png',
  'Cruel_Link.png',
  'Cruel_Memory.png',
  'Cruel_Multimedia.png',
  'Cumbersome_Bus.png',
  'Cynical_Plug-in.png',
  'Cynical_Screenshot.png',
  'Cynical_Spam.png',
  'Dangerous_App.png',
  'Dangerous_Cookie.png',
  'Decayed_Utility.png',
  'Deep_Joystick.png',
  'Deep_Keyboard.png',
  'Deep_Program.png',
  'Delicious_Dvd.png',
  'Delightful_Mirror.png',
  'Depraved_Cache.png',
  'Depraved_Link.png',
  'Depraved_Net.png',
  'Depressed_Malware.png',
  'Diminutive_Unix.png',
  'Disgusted_Frame.png',
  'Disgusted_Json.png',
  'Disgusted_Password.png',
  'Distinct_Hacker.png',
  'Distinct_User.png',
  'Distraught_Compress.png',
  'Distraught_Cyberspace.png',
  'Distraught_Script.png',
  'Distressed_Flaming.png',
  'Distressed_Output.png',
  'Disturbed_Hyperlink.png',
  'Disturbed_Integer.png',
  'Disturbed_Keyboard.png',
  'Dizzy_Resolution.png',
  'Drab_Command.png',
  'Drab_Workstation.png',
  'Drained_Format.png',
  'Drained_Gigabyte.png',
  'Drained_Key.png',
  'Ecstatic_Logic.png',
  'Elated_Domain.png',
  'Emaciated_Flowchart.png',
  'Enchanting_Key.png',
  'Encouraging_Algorithm.png',
  'Energetic_Cd.png',
  'Energetic_Joystick.png',
  'Enormous_Application.png',
  'Enthusiastic_Network.png',
  'Enthusiastic_Resolution.png',
  'Envious_Client.png',
  'Envious_Download.png',
  'Envious_Malware.png',
  'Exasperated_Login.png',
  'Excited_Memory.png',
  'Exhilarated_Digital.png',
  'Exhilarated_Snapshot.png',
  'Extensive_Format.png',
  'Extensive_Wiki.png',
  'Fancy_Configure.png',
  'Fancy_Mouse.png',
  'Fantastic_Screenshot.png',
  'Fierce_Debug.png',
  'Fierce_Protocol.png',
  'Fierce_Virtual.png',
  'Filthy_Compress.png',
  'Flat_Bite.png',
  'Flat_Folder.png',
  'Flat_Template.png',
  'Floppy_Bookmark.png',
  'Floppy_Bug.png',
  'Floppy_Icon.png',
  'Fluttering_Algorithm.png',
  'Fluttering_App.png',
  'Fluttering_Cypherpunk.png',
  'Fluttering_Node.png',
  'Fluttering_Virtual.png',
  'Fluttering_Wiki.png',
  'Foolish_Host.png',
  'Foolish_Keyword.png',
  'Foolish_Memory.png',
  'Foolish_Wiki.png',
  'Frantic_Firmware.png',
  'Frantic_Online.png',
  'Frantic_Workstation.png',
  'Fresh_Website.png',
  'Friendly_Dvd.png',
  'Friendly_Hyperlink.png',
  'Friendly_Keyboard.png',
  'Friendly_Protocol.png',
  'Friendly_Spam.png',
  'Frightened_File.png',
  'Frightened_Keyboard.png',
  'Frightened_Node.png',
  'Frightened_Spam.png',
  'Frothy_Kernel.png',
  'Frothy_Table.png',
  'Frustrating_Hyperlink.png',
  'Fuzzy_Desktop.png',
  'Fuzzy_Iteration.png',
  'Fuzzy_Upload.png',
  'Gaudy_Lurking.png',
  'Gaudy_Typeface.png',
  'Gentle_Surf.png',
  'Ghastly_Analog.png',
  'Ghastly_Toolbar.png',
  'Giddy_Java.png',
  'Giddy_Protocol.png',
  'Giddy_Storage.png',
  'Gigantic_Dns_.png',
  'Gigantic_Emoticon.png',
  'Gigantic_Media.png',
  'Gigantic_Script.png',
  'Glamorous_Enter.png',
  'Glamorous_Frame.png',
  'Gleaming_Binary.png',
  'Gleaming_Cd.png',
  'Gleaming_Copy.png',
  'Gleaming_Dns_.png',
  'Gleaming_Media.png',
  'Gleaming_Program.png',
  'Glorious_Broadband.png',
  'Glorious_Page.png',
  'Gorgeous_Flash.png',
  'Gorgeous_Phishing.png',
  'Graceful_Cyberspace.png',
  'Graceful_Motherboard.png',
  'Graceful_Platform.png',
  'Graceful_Web.png',
  'Greasy_Cookie.png',
  'Greasy_Hypertext.png',
  'Greasy_Typeface.png',
  'Grieving_Delete.png',
  'Grieving_Paste.png',
  'Gritty_Dashboard.png',
  'Gritty_Login.png',
  'Gritty_Screen.png',
  'Grotesque_Hardware.png',
  'Grubby_Spyware.png',
  'Grumpy_Debug.png',
  'Grumpy_Drag.png',
  'Grumpy_Path.png',
  'Grumpy_Screenshot.png',
  'Grumpy_Url.png',
  'Handsome_Byte.png',
  'Happy_Bus.png',
  'Happy_Cd.png',
  'Happy_Media.png',
  'Happy_Reboot.png',
  'Happy_Www.png',
  'Harebrained_Real-time.png',
  'Healthy_Virtual.png',
  'Helpful_Dns_.png',
  'Helpful_Domain.png',
  'Helpful_Graphics.png',
  'Helpful_Multimedia.png',
  'Helpful_Pirate.png',
  'Helpless_Bite.png',
  'Helpless_Linux.png',
  'Helpless_Path.png',
  'High_Cybercrime.png',
  'High_Freeware.png',
  'High_Plug-in.png',
  'Hollow_Decompress.png',
  'Hollow_Download.png',
  'Hollow_Java.png',
  'Hollow_Node.png',
  'Hollow_Pop-up.png',
  'Homely_Macro.png',
  'Homely_Multimedia.png',
  'Horrific_Frame.png',
  'Horrific_Hacker.png',
  'Huge_Encryption.png',
  'Huge_Scroll.png',
  'Hungry_Modem.png',
  'Hurt_Digital.png',
  'Hurt_Www.png',
  'Icy_Typeface.png',
  'Ideal_Binary.png',
  'Ideal_Integer.png',
  'Ideal_Logic.png',
  'Ideal_Qwerty.png',
  'Immense_Cypherpunk.png',
  'Immense_Reboot.png',
  'Impressionable_Buffer.png',
  'Impressionable_Desktop.png',
  'Intrigued_Hardware.png',
  'Intrigued_Save.png',
  'Intrigued_Shareware.png',
  'Intrigued_Wireless.png',
  'Intrigued_Zip.png',
  'Irate_Bitmap.png',
  'Irate_Security.png',
  'Irritable_Firmware.png',
  'Irritable_Screenshot.png',
  'Itchy_Keyword.png',
  'Itchy_Path.png',
  'Itchy_Queue.png',
  'Itchy_Screen.png',
  'Jealous_Application.png',
  'Jealous_Hyperlink.png',
  'Jealous_Keyboard.png',
  'Jealous_Reboot.png',
  'Jittery_Runtime.png',
  'Jittery_Teminal.png',
  'Jolly_Flaming.png',
  'Jolly_Unix.png',
  'Joyous_Hyperlink.png',
  'Joyous_Storage.png',
  'Joyous_Tag.png',
  'Joyous_Widget.png',
  'Juicy_Monitor.png',
  'Kind_Enter.png',
  'Kind_Scroll.png',
  'Kind_Tag.png',
  'Lackadaisical_Utility.png',
  'Large_Linux.png',
  'Lazy_Cd.png',
  'Little_Dvd.png',
  'Little_Queue.png',
  'Little_Shareware.png',
  'Lively_Boot.png',
  'Lively_Byte.png',
  'Lively_Scroll.png',
  'Loose_App.png',
  'Loose_Pop-up.png',
  'Lovely_Linux.png',
  'Lovely_Mainframe.png',
  'Lucky_Memory.png',
  'Lucky_Protocol.png',
  'Ludicrous_Storage.png',
  'Ludicrous_Wireless.png',
  'Magnificent_Password.png',
  'Mammoth_Teminal.png',
  'Maniacal_Bitmap.png',
  'Massive_Iteration.png',
  'Melancholy_Cybercrime.png',
  'Melancholy_Decompress.png',
  'Melancholy_Hacker.png',
  'Miniature_File.png',
  'Miniature_Scroll.png',
  'Miniature_Tag.png',
  'Minute_Process.png',
  'Minute_Root.png',
  'Minute_Www.png',
  'Misty_Flowchart.png',
  'Mortified_Graphics.png',
  'Motionless_Backup.png',
  'Motionless_Email.png',
  'Motionless_Online.png',
  'Muddy_Modem.png',
  'Narrow_Username.png',
  'Nasty_Array.png',
  'Nervous_Qwerty.png',
  'Nonchalant_Hacker.png',
  'Oblivious_Database.png',
  'Oblivious_Network.png',
  'Oblivious_Paste.png',
  'Obnoxious_Host.png',
  'Obnoxious_Page.png',
  'Odd_Flowchart.png',
  'Odd_Hypertext.png',
  'Odd_Scanner.png',
  'Old-fashioned_Application.png',
  'Old-fashioned_Icon.png',
  'Old-fashioned_Trash.png',
  'Outrageous_Captcha.png',
  'Outrageous_Inbox.png',
  'Perfect_Hacker.png',
  'Perfect_Router.png',
  'Petite_Computer.png',
  'Petite_Firmware.png',
  'Plain_Email.png',
  'Pleasant_Gigabyte.png',
  'Pleasant_Wireless.png',
  'Precious_Cpu_.png',
  'Precious_Software.png',
  'Prickly_Spam.png',
  'Pungent_Flash.png',
  'Puny_Web.png',
  'Quizzical_Browser.png',
  'Quizzical_Script.png',
  'Reassured_Inbox.png',
  'Reassured_Kernel.png',
  'Reassured_Net.png',
  'Ripe_Print.png',
  'Robust_Queue.png',
  'Rotten_Document.png',
  'Rotund_Resolution.png',
  'Rough_Ram.png',
  'Rough_Utility.png',
  'Rough_Web.png',
  'Round_Real-time.png',
  'Salty_Mainframe.png',
  'Scant_Array.png',
  'Scant_Network.png',
  'Scary_Computer.png',
  'Scary_Encryption.png',
  'Scary_Scan.png',
  'Scattered_Dns_.png',
  'Scattered_Dvd.png',
  'Scattered_Typeface.png',
  'Scrawny_Bug.png',
  'Scrawny_Programmer.png',
  'Selfish_Dns_.png',
  'Selfish_Router.png',
  'Shaggy_Teminal.png',
  'Shallow_Host.png',
  'Shiny_Podcast.png',
  'Short_Real-time.png',
  'Silky_Document.png',
  'Silly_Graphics.png',
  'Skinny_Buffer.png',
  'Skinny_Flaming.png',
  'Slimy_Backup.png',
  'Slimy_Protocol.png',
  'Slimy_Version.png',
  'Slippery_Dot.png',
  'Small_Configure.png',
  'Small_Data.png',
  'Small_Flaming.png',
  'Small_Icon.png',
  'Smiling_Folder.png',
  'Smoggy_Cypherpunk.png',
  'Smoggy_Monitor.png',
  'Smoggy_Spam.png',
  'Smooth_Buffer.png',
  'Smug_Cypherpunk.png',
  'Smug_Graphics.png',
  'Smug_Screen.png',
  'Smug_Upload.png',
  'Soggy_Disk.png',
  'Soggy_Security.png',
  'Soggy_Terabyte.png',
  'Solid_Network.png',
  'Solid_Qwerty.png',
  'Sour_Folder.png',
  'Sour_Privacy.png',
  'Sparkling_Cache.png',
  'Sparkling_Exabyte.png',
  'Spicy_Compress.png',
  'Spicy_Graphics.png',
  'Spicy_Integer.png',
  'Spicy_Path.png',
  'Splendid_Joystick.png',
  'Spotless_Net.png',
  'Spotless_Windows.png',
  'Spotless_Workstation.png',
  'Square_Database.png',
  'Stale_Multimedia.png',
  'Stale_Windows.png',
  'Steady_File.png',
  'Steep_Exabyte.png',
  'Stout_App.png',
  'Stout_Array.png',
  'Stout_Gigabyte.png',
  'Strange_Programmer.png',
  'Strong_Flash.png',
  'Stunning_Compress.png',
  'Substantial_Algorithm.png',
  'Substantial_Program.png',
  'Successful_Screen.png',
  'Succulent_Debug.png',
  'Superficial_Lurking.png',
  'Superficial_Online.png',
  'Swanky_Drag.png',
  'Swanky_Dvd.png',
  'Tart_Xml.png',
  'Tasty_Document.png',
  'Tasty_Login.png',
  'Tender_Bit.png',
  'Tender_Byte.png',
  'Tense_Client.png',
  'Terrible_Folder.png',
  'Terrible_Table.png',
  'Thoughtless_Dashboard.png',
  'Tight_Hardware.png',
  'Tight_Integer.png',
  'Timely_Firewall.png',
  'Timely_Host.png',
  'Timely_Network.png',
  'Timely_Queue.png',
  'Timely_Version.png',
  'Tricky_Integer.png',
  'Tricky_Net.png',
  'Tricky_Wiki.png',
  'Trite_Option.png',
  'Troubled_Screen.png',
  'Uneven_Captcha.png',
  'Uneven_Dvd.png',
  'Uneven_Graphics.png',
  'Unsightly_Computer.png',
  'Unsightly_Inbox.png',
  'Unsightly_Mainframe.png',
  'Upset_Encryption.png',
  'Uptight_Graphics.png',
  'Uptight_Hardware.png',
  'Vexed_Scanner.png',
  'Victorious_Integer.png',
  'Victorious_Kernel.png',
  'Victorious_Reboot.png',
  'Vivacious_Thread.png',
  'Vivacious_Xml.png',
  'Wacky_Shell.png',
  'Weary_Process.png',
  'Whimsical_Bitmap.png',
  'Whimsical_Delete.png',
  'Whimsical_Macro.png',
  'Whimsical_Portal.png',
  'Whimsical_Shift.png',
  'Whopping_Emoticon.png',
  'Witty_Gigabyte.png',
  'Witty_Net.png',
  'Witty_Window.png',
  'Wonderful_Command.png',
  'Wonderful_Storage.png',
  'Zany_Runtime.png',
  'Zealous_Bookmark.png',
  'Zealous_Platform.png',
  'Zippy_Online.png',
  'Zippy_Program.png',
  'Zippy_Screen.png',
  'Zippy_Www.png'] */

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

  //console.log("\n\n Loading artwork.json...\n");
  const artwork = JSON.parse(fs.readFileSync("../../artwork4.json").toString())
  //const mandellas = JSON.parse(fs.readFileSync(""))

 /* for (let a in filesources) {
  fs.copyFile(`../react-app/600bots/${filesources[a]}`, `../react-app/500pngs/${filesources[a]}`, (err) => {
    if (err) throw err;
    console.log('source.png was copied to destination.png');
  });
} */
 

  /* for(let a in artwork){
  let scoredNames = artwork[a].name.replace(/ /g,"_")
    let removeMars = scoredNames.replace(/_Mars_Shot_Bot/g,"")
    //var old = JSON.stringify(artwork) //convert to JSON string
//var newArray = JSON.parse(old); //convert back to array
 const dominantColor = await getColorFromURL(`../react-app/136/${removeMars}.png`);
    console.log(dominantColor)
    let rgbstring = 'rgb(' + dominantColor.join() + ')'
    let rgb = rgb2hex(rgbstring).hex
    const n_match = ntc.name(`${rgb}`);
    let colorname = n_match[1]
    console.log(n_match[1])
    console.log(rgb)
    //correctly appends background color
    artwork[a].attributes.push({"trait_type":"mandala_color","value":`${colorname}`}) */
    
    


//(a; a += 2;) //Add two to i every iteration
    //for(let a in artwork) {
      //const stringJSON = JSON.stringify(artwork[a])
     //console.log("  copying "+artwork[a].name+"...")
    //console.log("creating json files")
    //fs.writeFileSync(`../react-app/finaljsons/${artwork[a]}.json`, stringJSON)}}
    //sleep(1000)
    //const uploaded = await ipfs.add(stringJSON)
    //console.log("   "+artwork[a].name+" ipfs:",uploaded.path)
    //allAssets[uploaded.path] = artwork[a]   


    
  
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
      allAssets[uploaded.path] = artwork[a]
    }*/
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


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });