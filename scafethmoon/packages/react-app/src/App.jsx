import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import {  JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import {  LinkOutlined } from "@ant-design/icons"
import "./App.css";
import { Row, Col, Button, Alert, Input, List, Card } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import { useExchangePrice, useGasPrice, useUserProvider, useContractLoader, useContractReader, useEventListener, useBalance, useExternalContractLoader } from "./hooks";
import { Header, Account, Faucet, Ramp, Contract, GasGauge, Address, AddressInput } from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { utils, ethers } from "ethers";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import ReactJson from 'react-json-view'
import assets from "./assets.js";
import { Divider } from "rc-menu";


const { BufferList } = require('bl')
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

// console.log("📦 Assets: ", assets)

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS['rinkeby']; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = false

//EXAMPLE STARTING JSON:
const STARTING_JSON = {
  "description": "It's actually a bison?",
  "external_url": "https://austingriffith.com/portfolio/paintings/",// <-- this can link to a page for the specific file too
  "image": "https://austingriffith.com/images/paintings/buffalo.jpg",
  "name": "Buffalo",
  "attributes": [
     {
       "trait_type": "BackgroundColor",
       "value": "green"
     },
     {
       "trait_type": "Eyes",
       "value": "googly"
     }
  ]
}

//helper function to "Get" from IPFS
// you usually go content.toString() after this...
const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    console.log(file.path)
    if (!file.content) continue;
    const content = new BufferList()
    for await (const chunk of file.content) {
      content.append(chunk)
    }
    console.log(content)
    return content
  }
}

// 🛰 providers
if(DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
const scaffoldEthProvider = new JsonRpcProvider("https://rpc.scaffoldeth.io:48544")
const mainnetInfura = new JsonRpcProvider("https://eth-mainnet.alchemyapi.io/v2/9aVgraLC73OSl72s6mUAyY3LwFkHVNYy")
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_I

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if(DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new JsonRpcProvider(localProviderUrlFromEnv);


// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;


function App(props) {

  const mainnetProvider = (scaffoldEthProvider && scaffoldEthProvider._network) ? scaffoldEthProvider : mainnetInfura
  if(DEBUG) console.log("🌎 mainnetProvider",mainnetProvider)

  const [injectedProvider, setInjectedProvider] = useState();
  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangePrice(targetNetwork,mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork,"fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProvider = useUserProvider(injectedProvider, localProvider);
  const address = useUserAddress(userProvider);
  if(DEBUG) console.log("👩‍💼 selected address:",address)

  // You can warn the user if you would like them to be on a specific network
  let localChainId = localProvider && localProvider._network && localProvider._network.chainId
  if(DEBUG) console.log("🏠 localChainId",localChainId)

  let selectedChainId = userProvider && userProvider._network && userProvider._network.chainId
  if(DEBUG) console.log("🕵🏻‍♂️ selectedChainId:",selectedChainId)

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userProvider, gasPrice)

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice)

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
   const yourLocalBalance = useBalance(localProvider, address);
   if(DEBUG) console.log("💵 yourLocalBalance",yourLocalBalance?formatEther(yourLocalBalance):"...")

  // Just plug in different 🛰 providers to get your balance on different chains:
  // const yourMainnetBalance = useBalance(mainnetProvider, address);
  // if(DEBUG) console.log("💵 yourMainnetBalance",yourMainnetBalance?formatEther(yourMainnetBalance):"...")

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider)
  if(DEBUG) console.log("📝 readContracts", readContracts)

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider)
  if(DEBUG) console.log("🔐 writeContracts", writeContracts)

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  // const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI)
  // console.log("🌍 DAI contract on mainnet:", mainnetDAIContract)
  //
  // Then read your DAI balance like:
  // const myMainnetDAIBalance = useContractReader({DAI: mainnetDAIContract},"DAI", "balanceOf",["0x34aA3F359A9D614239015126635CE7732c18fDF3"])
  // console.log("🥇 myMainnetDAIBalance:", myMainnetDAIBalance)


  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts, "MarsShotBots", "balanceOf", [ address ])
  // console.log("🤗  balance: ", balance)

  const priceToMint = useContractReader(readContracts, "MarsShotBots", "price")
  // console.log("🤗  priceToMint: ", priceToMint)

  //📟 Listen for broadcast events
  const transferEvents = useEventListener(readContracts, "MarsShotBots", "Transfer", localProvider, 1);
  // console.log("📟  Transfer events: ", transferEvents)

  //track the latest bots minted
  const [lastestMintedBots, setLatestMintedBots] = useState();
  // console.log("📟 latestBotsMinted:", lastestMintedBots);

  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber()
  const [ yourCollectibles, setYourCollectibles ] = useState()

  useEffect(()=>{
    const updateYourCollectibles = async () => {
      let collectibleUpdate = []
      for(let tokenIndex = 0; tokenIndex < balance; tokenIndex++){
        try{
          // console.log("Getting token index",tokenIndex)
          const tokenId = await readContracts.MarsShotBots.tokenOfOwnerByIndex(address, tokenIndex)
          // console.log("tokenId", tokenId)
          const tokenURI = await readContracts.MarsShotBots.tokenURI(tokenId)
          // console.log("tokenURI", tokenURI)

          const ipfsHash =  tokenURI.replace("https://forgottenbots.mypinata.cloud/ipfs/","")
          // console.log("ipfsHash", ipfsHash)

          const jsonManifestBuffer = await getFromIPFS(ipfsHash)

          try {
            const jsonManifest = JSON.parse(jsonManifestBuffer.toString())
            // console.log("jsonManifest",jsonManifest)
            collectibleUpdate.push({ id:tokenId, uri:tokenURI, owner: address, ...jsonManifest })
          } catch (e) { console.log(e) }

        } catch (e) { console.log(e) }
      }
      setYourCollectibles(collectibleUpdate)
    }
    updateYourCollectibles()
  },[ address, yourBalance ])

  useEffect(() => {
    const getLatestMintedBots = async () => {
      let latestMintedBotsUpdate = [];

      for( let botIndex = 0; botIndex < 5; botIndex++){
        if (transferEvents.length > 0){
          try{
          let tokenId = transferEvents[botIndex].tokenId.toNumber()
          const tokenURI = await readContracts.MarsShotBots.tokenURI(tokenId);
          const ipfsHash = tokenURI.replace("https://forgottenbots.mypinata.cloud/ipfs/", "");
          const jsonManifestBuffer = await getFromIPFS(ipfsHash);

            try {
              const jsonManifest = JSON.parse(jsonManifestBuffer.toString());
              latestMintedBotsUpdate.push({ id: tokenId, uri: tokenURI, owner: address, ...jsonManifest });
            } catch (e) {
              console.log(e);
            }
          } catch (e) {
            console.log(e);
          }
        }
      }
      setLatestMintedBots(latestMintedBotsUpdate);
    }
    getLatestMintedBots();
  }, [address, yourBalance]);

  let networkDisplay = ""
  if(localChainId && selectedChainId && localChainId != selectedChainId ){
    networkDisplay = (
      <div style={{zIndex:2, position:'absolute', right:0,top:60,padding:16}}>
        <Alert
          message={"⚠️ Wrong Network"}
          description={(
            <div>
              You have <b>{NETWORK(selectedChainId).name}</b> selected and you need to be on <b>{NETWORK(localChainId).name}</b>.
            </div>
          )}
          type="error"
          closable={false}
        />
      </div>
    )
  } else {
    networkDisplay = (
      <div style={{ zIndex:-1, position:'absolute', right:154, top:28, padding:16, color:targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    )
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new Web3Provider(provider));
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname)
  }, [setRoute]);

  let faucetHint = ""
  const faucetAvailable = localProvider && localProvider.connection && localProvider.connection.url && localProvider.connection.url.indexOf(window.location.hostname)>=0 && !process.env.REACT_APP_PROVIDER && price > 1;

  const [ faucetClicked, setFaucetClicked ] = useState( false );
  if(!faucetClicked && localProvider && localProvider._network && localProvider._network.chainId==31337 && yourLocalBalance && formatEther(yourLocalBalance) <= 0){
    faucetHint = (
      <div style={{padding:16}}>
        <Button type={"primary"} onClick={()=>{
          faucetTx({
            to: address,
            value: parseEther("0.01"),
          });
          setFaucetClicked(true)
        }}>
          💰 Grab funds from the faucet ⛽️
        </Button>
      </div>
    )
  }

  const [ yourJSON, setYourJSON ] = useState( STARTING_JSON );
  const [ sending, setSending ] = useState()
  const [ ipfsHash, setIpfsHash ] = useState()
  const [ ipfsDownHash, setIpfsDownHash ] = useState()
  const [ downloading, setDownloading ] = useState()
  const [ ipfsContent, setIpfsContent ] = useState()
  const [ transferToAddresses, setTransferToAddresses ] = useState({})

  return (
    <div className="App">
      <Header />
        {networkDisplay}
      <BrowserRouter>
        <Switch>
          <Route exact path="/">
            <div className="">
            <img className="logo_moonshot sub" src="Melancholy_Cybercrime.png" />
            <img className="logo_moonshot" src="mandalabot.png" />
            <img className="logo_moonshot sub" src="Aloof_Database.png" />
            <br/>
            <img className="logo_moonshot sub2" src="rocket1.png" /><h1 >Mars Shot Bots</h1><img class="logo_moonshot sub2" src="rocket2.png" />
            <h2>A ⭐️SUPER-Rare⭐️ PFP (502 supply)</h2>
            <h2>Assets Created and Abandoned 😭 by ya bois <a href="https://twitter.com/owocki">@owocki</a>, <a href="https://gitcoin.co/octaviaan">@octaviaan</a> & <a href="https://twitter.com/austingriffith">@austingriffith</a></h2>
            <h2>❤️🛠 Deployed on "x", after an extended rescue mission. </h2>
            <div style={{ padding:32 }}>
              <Button type={ "primary" } onClick={async ()=>{
                let price = await readContracts.MarsShotBots.price()
                tx( writeContracts.MarsShotBots.requestMint({value: priceToMint, from: address}))
              }}>MINT for Ξ{priceToMint && (+ethers.utils.formatEther(priceToMint)).toFixed(4)}</Button>

              <div className="publicgoodsgood">
                <h2>❤️*100% Proceeds To Public Goods❤️</h2>
                 <strong>100%</strong> of Proceeds fund Ethereum Public Goods on Gitcoin Grants<br/>
                 <strong>🦧✊🌱100%🌱✊🦧</strong>
              </div>
              <br/>
              <br/>
              {lastestMintedBots && lastestMintedBots.length > 0 ? (
                <div className="latestBots">
                  <h4 style={{ padding:5 }}>Your Mars-Shot-Bots 🤖</h4>
                
                <List
                  dataSource={lastestMintedBots}
                  renderItem={item => {
                    const id = item.id;
                    return (
                      <Row align="middle" gutter={[4, 4]}>
                        <Col span={24}>
                          <List.Item key={item.id} style={{ display: 'inline'}}>
                            <Card
                              style={{ borderBottom:'none', border: 'none', background: "none"}}
                              title={
                                <div style={{ display: 'inline', fontSize: 16, marginRight: 8, color: 'white' }}>
                                  #{id} {item.name}
                                </div>                            
                              }
                            >
                              <div>
                                <img src={item.image} style={{ maxWidth: 150 }} />
                              </div>
                            </Card>
                            {/*  */}
                          </List.Item>
                        </Col>
                        
                        {/* <Col span={12}>
                        <List.Item key={item.id} style={{ display: 'inline'}}>
                          <div style={{ alignContent: "center", width: "300px" }}>
                              owner: <Address
                                  address={item.owner}
                                  ensProvider={mainnetProvider}
                                  blockExplorer={blockExplorer}
                                  fontSize={16}
                              />
                              <AddressInput
                                ensProvider={mainnetProvider}
                                placeholder="transfer to address"
                                value={transferToAddresses[id]}
                                onChange={(newValue)=>{
                                  let update = {}
                                  update[id] = newValue
                                  setTransferToAddresses({ ...transferToAddresses, ...update})
                                }}
                              />
                              <Button onClick={()=>{
                                console.log("writeContracts",writeContracts)
                                tx( writeContracts.MarsShotBots.transferFrom(address, transferToAddresses[id], id) )
                              }}>
                                Transfer
                              </Button>
                            </div>
                          </List.Item>
                        </Col> */}
                      </Row>
                      
                    );
                  }}
                />
              </div>
            ) : (
              <div></div>
            )}
              <br />
              <br /> 
              </div>

            {yourCollectibles && yourCollectibles.length>0 ?
              (<div></div>)
              :
              (
                <div class="colorme2">

                  <h4 style={{padding:5}}>Why We Think Mars-Shot-Bots Rock:</h4>
                  <br/>
                  <br/>
                  <ul class="rocks">
                    <li>
                    🤖🍠 These bots are the first theme-derivative spin-off to MoonShotBots!  
                    </li>
                    <li>
                    🤖👑 Oh the Novelty!
                    </li>
                    <li>
                    🤖🌱 100% Proceeds Support Public Goods!
                    </li>              
                    <li>
                    🤖❤️ Hang with your marsfrens on <a  href="https://discord.gg/ACKb28pSSP">Discord</a> & <a href="https://t.me/joinchat/v6N_GHY-8kU3ZmRh">Telegram</a>
                    </li>
                    
                  </ul>


                </div>
              )
            }
    
            {yourCollectibles && yourCollectibles.length > 0 ?
              <div></div>
              :
            <div class="colorme3">

            <h4 style={{padding:5}}>Testimonials:</h4>
            <br/>
            <br/>
            <div class='Testimonial'>
              <img src="Aloof_Database.png" />
              <h5>Acidic Debug</h5>
              <p>01100001 01110101 01110011 01110100 01101001 01101110 00100000 01110111 01101000 01111001 00100000 01100100 01101111</p>
            </div>
            <div class='Testimonial'>
              <img src="Acidic_Debug.png" />
              <h5>Simpl</h5>
              <p>bzzz bzzz bzz new fax incoming

kwwaaaaaaaaaaaaa

eeeeeuuuueeuuueeuuuu **denga denga**

we made our mistakes, but you didnt have to abandon us :(</p>
            </div>
            <div class='Testimonial'>
              <img src="Alert_Desktop.png" />
              <h5>Alert Desktop</h5>
              <p>Beep Boop Bop Bop Moonshot Collective is not associated with my stupid antics Beep Boop Bot Boop Boop Bloop Beep  Boop Boop Bloop Beep </p>
            </div>


            </div>
             }


            </div>



            {/* {yourCollectibles && yourCollectibles.length>0 ?
              <div style={{ width:640, margin: "auto", marginTop:32, padding:32 }}>
               <h4 style={{padding:5}}>Your Mars-Shot-Bots 🤖</h4>
            <br/>
            <br/>

                <List
                  bordered
                  dataSource={yourCollectibles}
                  renderItem={(item) => {
                    const id = item.id.toNumber()
                    return (
                      <List.Item>
                        <Card title={(
                          <div>
                            <span style={{fontSize:16, marginRight:8}}>#{id}</span> {item.name}
                          </div>
                        )}>
                          <div><img src={item.image} style={{maxWidth:150}} /></div>
                          <div>{item.description}</div>
                        </Card>

                        <div>
                          owner: <Address
                              address={item.owner}
                              ensProvider={mainnetProvider}
                              blockExplorer={blockExplorer}
                              fontSize={16}
                          />
                          <AddressInput
                            ensProvider={mainnetProvider}
                            placeholder="transfer to address"
                            value={transferToAddresses[id]}
                            onChange={(newValue)=>{
                              let update = {}
                              update[id] = newValue
                              setTransferToAddresses({ ...transferToAddresses, ...update})
                            }}
                          />
                          <Button onClick={()=>{
                            console.log("writeContracts",writeContracts)
                            tx( writeContracts.MarsShotBots.transferFrom(address, transferToAddresses[id], id) )
                          }}>
                            Transfer
                          </Button>
                        </div>
                      </List.Item>
                    )
                  }}
                />
              </div>: */}

            <div id="preview">
              <h4>Rescue these bots from mars! It hasn't been terraformed yet! 🤖🏠❤️</h4>
              <h4>(this order is not reflective of actual mint order!) 🤖🏠❤️</h4>           
            <br/>
            <br/>

            <img src="nfts/Abrupt_Memory.png" title='Abrupt_Paste'/>
<img src="nfts/Acidic_Debug.png" title='Abrupt_Paste'/>
<img src="nfts/Acidic_Programmer.png" title='Abrupt_Paste'/>
<img src="nfts/Adorable_Laptop.png" title='Abrupt_Paste'/>
<img src="nfts/Adorable_Unix.png" title='Abrupt_Paste'/>
<img src="nfts/Adventurous_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Agitated_App.png" title='Abrupt_Paste'/>
<img src="nfts/Agitated_Root.png" title='Abrupt_Paste'/>
<img src="nfts/Alert_Desktop.png" title='Abrupt_Paste'/>
<img src="nfts/Aloof_Database.png" title='Abrupt_Paste'/>
<img src="nfts/Amiable_Queue.png" title='Abrupt_Paste'/>
<img src="nfts/Annoyed_Command.png" title='Abrupt_Paste'/>
<img src="nfts/Annoyed_Restore.png" title='Abrupt_Paste'/>
<img src="nfts/Annoyed_Table.png" title='Abrupt_Paste'/>
<img src="nfts/Antsy_Protocol.png" title='Abrupt_Paste'/>
<img src="nfts/Antsy_Security.png" title='Abrupt_Paste'/>
<img src="nfts/Appalling_Java.png" title='Abrupt_Paste'/>
<img src="nfts/Appalling_Worm.png" title='Abrupt_Paste'/>
<img src="nfts/Appetizing_Link.png" title='Abrupt_Paste'/>
<img src="nfts/Appetizing_Media.png" title='Abrupt_Paste'/>
<img src="nfts/Appetizing_Podcast.png" title='Abrupt_Paste'/>
<img src="nfts/Apprehensive_Virtual.png" title='Abrupt_Paste'/>
<img src="nfts/Arrogant_Compress.png" title='Abrupt_Paste'/>
<img src="nfts/Arrogant_Flash.png" title='Abrupt_Paste'/>
<img src="nfts/Ashamed_Disk.png" title='Abrupt_Paste'/>
<img src="nfts/Ashamed_Net.png" title='Abrupt_Paste'/>
<img src="nfts/Ashamed_Website.png" title='Abrupt_Paste'/>
<img src="nfts/Attractive_Workstation.png" title='Abrupt_Paste'/>
<img src="nfts/Average_Debug.png" title='Abrupt_Paste'/>
<img src="nfts/Batty_Blog.png" title='Abrupt_Paste'/>
<img src="nfts/Batty_Cookie.png" title='Abrupt_Paste'/>
<img src="nfts/Batty_Email.png" title='Abrupt_Paste'/>
<img src="nfts/Beefy_Html.png" title='Abrupt_Paste'/>
<img src="nfts/Beefy_Virtual.png" title='Abrupt_Paste'/>
<img src="nfts/Biting_Encryption.png" title='Abrupt_Paste'/>
<img src="nfts/Biting_Link.png" title='Abrupt_Paste'/>
<img src="nfts/Bitter_Dot_matrix.png" title='Abrupt_Paste'/>
<img src="nfts/Bitter_Hardware.png" title='Abrupt_Paste'/>
<img src="nfts/Bland_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Blushing_Firewall.png" title='Abrupt_Paste'/>
<img src="nfts/Bright_Spreadsheet.png" title='Abrupt_Paste'/>
<img src="nfts/Charming_Dot.png" title='Abrupt_Paste'/>
<img src="nfts/Charming_Storage.png" title='Abrupt_Paste'/>
<img src="nfts/Cheeky_User.png" title='Abrupt_Paste'/>
<img src="nfts/Cheeky_Wireless.png" title='Abrupt_Paste'/>
<img src="nfts/Cheerful_Command.png" title='Abrupt_Paste'/>
<img src="nfts/Cheerful_Hacker.png" title='Abrupt_Paste'/>
<img src="nfts/Chubby_Bit.png" title='Abrupt_Paste'/>
<img src="nfts/Chubby_Enter.png" title='Abrupt_Paste'/>
<img src="nfts/Clean_Dynamic.png" title='Abrupt_Paste'/>
<img src="nfts/Clean_Process.png" title='Abrupt_Paste'/>
<img src="nfts/Clear_Algorithm.png" title='Abrupt_Paste'/>
<img src="nfts/Clear_Encrypt.png" title='Abrupt_Paste'/>
<img src="nfts/Clear_Pop-up.png" title='Abrupt_Paste'/>
<img src="nfts/Cloudy_Macintosh.png" title='Abrupt_Paste'/>
<img src="nfts/Clueless_Email.png" title='Abrupt_Paste'/>
<img src="nfts/Clumsy_Cd-rom.png" title='Abrupt_Paste'/>
<img src="nfts/Clumsy_Username.png" title='Abrupt_Paste'/>
<img src="nfts/Colorful_Platform.png" title='Abrupt_Paste'/>
<img src="nfts/Colossal_Joystick.png" title='Abrupt_Paste'/>
<img src="nfts/Colossal_Macintosh.png" title='Abrupt_Paste'/>
<img src="nfts/Colossal_Script.png" title='Abrupt_Paste'/>
<img src="nfts/Combative_Internet.png" title='Abrupt_Paste'/>
<img src="nfts/Combative_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Comfortable_Encryption.png" title='Abrupt_Paste'/>
<img src="nfts/Condemned_Script.png" title='Abrupt_Paste'/>
<img src="nfts/Condescending_Thread.png" title='Abrupt_Paste'/>
<img src="nfts/Contemplative_Password.png" title='Abrupt_Paste'/>
<img src="nfts/Convoluted_Xml.png" title='Abrupt_Paste'/>
<img src="nfts/Cooperative_Binary.png" title='Abrupt_Paste'/>
<img src="nfts/Corny_Data.png" title='Abrupt_Paste'/>
<img src="nfts/Corny_Enter.png" title='Abrupt_Paste'/>
<img src="nfts/Costly_Spam.png" title='Abrupt_Paste'/>
<img src="nfts/Courageous_Program.png" title='Abrupt_Paste'/>
<img src="nfts/Courageous_Snapshot.png" title='Abrupt_Paste'/>
<img src="nfts/Creepy_Firmware.png" title='Abrupt_Paste'/>
<img src="nfts/Creepy_Portal.png" title='Abrupt_Paste'/>
<img src="nfts/Crooked_Dashboard.png" title='Abrupt_Paste'/>
<img src="nfts/Crooked_Download.png" title='Abrupt_Paste'/>
<img src="nfts/Crooked_Worm.png" title='Abrupt_Paste'/>
<img src="nfts/Cruel_Link.png" title='Abrupt_Paste'/>
<img src="nfts/Cruel_Memory.png" title='Abrupt_Paste'/>
<img src="nfts/Cruel_Multimedia.png" title='Abrupt_Paste'/>
<img src="nfts/Cumbersome_Bus.png" title='Abrupt_Paste'/>
<img src="nfts/Cynical_Plug-in.png" title='Abrupt_Paste'/>
<img src="nfts/Cynical_Screenshot.png" title='Abrupt_Paste'/>
<img src="nfts/Cynical_Spam.png" title='Abrupt_Paste'/>
<img src="nfts/Dangerous_App.png" title='Abrupt_Paste'/>
<img src="nfts/Dangerous_Cookie.png" title='Abrupt_Paste'/>
<img src="nfts/Decayed_Utility.png" title='Abrupt_Paste'/>
<img src="nfts/Deep_Joystick.png" title='Abrupt_Paste'/>
<img src="nfts/Deep_Keyboard.png" title='Abrupt_Paste'/>
<img src="nfts/Deep_Program.png" title='Abrupt_Paste'/>
<img src="nfts/Delicious_Dvd.png" title='Abrupt_Paste'/>
<img src="nfts/Delightful_Mirror.png" title='Abrupt_Paste'/>
<img src="nfts/Depraved_Cache.png" title='Abrupt_Paste'/>
<img src="nfts/Depraved_Link.png" title='Abrupt_Paste'/>
<img src="nfts/Depraved_Net.png" title='Abrupt_Paste'/>
<img src="nfts/Depressed_Malware.png" title='Abrupt_Paste'/>
<img src="nfts/Diminutive_Unix.png" title='Abrupt_Paste'/>
<img src="nfts/Disgusted_Frame.png" title='Abrupt_Paste'/>
<img src="nfts/Disgusted_Json.png" title='Abrupt_Paste'/>
<img src="nfts/Disgusted_Password.png" title='Abrupt_Paste'/>
<img src="nfts/Distinct_Hacker.png" title='Abrupt_Paste'/>
<img src="nfts/Distinct_User.png" title='Abrupt_Paste'/>
<img src="nfts/Distraught_Compress.png" title='Abrupt_Paste'/>
<img src="nfts/Distraught_Cyberspace.png" title='Abrupt_Paste'/>
<img src="nfts/Distraught_Script.png" title='Abrupt_Paste'/>
<img src="nfts/Distressed_Flaming.png" title='Abrupt_Paste'/>
<img src="nfts/Distressed_Output.png" title='Abrupt_Paste'/>
<img src="nfts/Disturbed_Hyperlink.png" title='Abrupt_Paste'/>
<img src="nfts/Disturbed_Integer.png" title='Abrupt_Paste'/>
<img src="nfts/Disturbed_Keyboard.png" title='Abrupt_Paste'/>
<img src="nfts/Dizzy_Resolution.png" title='Abrupt_Paste'/>
<img src="nfts/Drab_Command.png" title='Abrupt_Paste'/>
<img src="nfts/Drab_Workstation.png" title='Abrupt_Paste'/>
<img src="nfts/Drained_Format.png" title='Abrupt_Paste'/>
<img src="nfts/Drained_Gigabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Drained_Key.png" title='Abrupt_Paste'/>
<img src="nfts/Ecstatic_Logic.png" title='Abrupt_Paste'/>
<img src="nfts/Elated_Domain.png" title='Abrupt_Paste'/>
<img src="nfts/Emaciated_Flowchart.png" title='Abrupt_Paste'/>
<img src="nfts/Enchanting_Key.png" title='Abrupt_Paste'/>
<img src="nfts/Encouraging_Algorithm.png" title='Abrupt_Paste'/>
<img src="nfts/Energetic_Cd.png" title='Abrupt_Paste'/>
<img src="nfts/Energetic_Joystick.png" title='Abrupt_Paste'/>
<img src="nfts/Enormous_Application.png" title='Abrupt_Paste'/>
<img src="nfts/Enthusiastic_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Enthusiastic_Resolution.png" title='Abrupt_Paste'/>
<img src="nfts/Envious_Client.png" title='Abrupt_Paste'/>
<img src="nfts/Envious_Download.png" title='Abrupt_Paste'/>
<img src="nfts/Envious_Malware.png" title='Abrupt_Paste'/>
<img src="nfts/Exasperated_Login.png" title='Abrupt_Paste'/>
<img src="nfts/Excited_Memory.png" title='Abrupt_Paste'/>
<img src="nfts/Exhilarated_Digital.png" title='Abrupt_Paste'/>
<img src="nfts/Exhilarated_Snapshot.png" title='Abrupt_Paste'/>
<img src="nfts/Extensive_Format.png" title='Abrupt_Paste'/>
<img src="nfts/Extensive_Wiki.png" title='Abrupt_Paste'/>
<img src="nfts/Fancy_Configure.png" title='Abrupt_Paste'/>
<img src="nfts/Fancy_Mouse.png" title='Abrupt_Paste'/>
<img src="nfts/Fantastic_Screenshot.png" title='Abrupt_Paste'/>
<img src="nfts/Fierce_Debug.png" title='Abrupt_Paste'/>
<img src="nfts/Fierce_Protocol.png" title='Abrupt_Paste'/>
<img src="nfts/Fierce_Virtual.png" title='Abrupt_Paste'/>
<img src="nfts/Filthy_Compress.png" title='Abrupt_Paste'/>
<img src="nfts/Flat_Bite.png" title='Abrupt_Paste'/>
<img src="nfts/Flat_Folder.png" title='Abrupt_Paste'/>
<img src="nfts/Flat_Template.png" title='Abrupt_Paste'/>
<img src="nfts/Floppy_Bookmark.png" title='Abrupt_Paste'/>
<img src="nfts/Floppy_Bug.png" title='Abrupt_Paste'/>
<img src="nfts/Floppy_Icon.png" title='Abrupt_Paste'/>
<img src="nfts/Fluttering_Algorithm.png" title='Abrupt_Paste'/>
<img src="nfts/Fluttering_App.png" title='Abrupt_Paste'/>
<img src="nfts/Fluttering_Cypherpunk.png" title='Abrupt_Paste'/>
<img src="nfts/Fluttering_Node.png" title='Abrupt_Paste'/>
<img src="nfts/Fluttering_Virtual.png" title='Abrupt_Paste'/>
<img src="nfts/Fluttering_Wiki.png" title='Abrupt_Paste'/>
<img src="nfts/Foolish_Host.png" title='Abrupt_Paste'/>
<img src="nfts/Foolish_Keyword.png" title='Abrupt_Paste'/>
<img src="nfts/Foolish_Memory.png" title='Abrupt_Paste'/>
<img src="nfts/Foolish_Wiki.png" title='Abrupt_Paste'/>
<img src="nfts/Frantic_Firmware.png" title='Abrupt_Paste'/>
<img src="nfts/Frantic_Online.png" title='Abrupt_Paste'/>
<img src="nfts/Frantic_Workstation.png" title='Abrupt_Paste'/>
<img src="nfts/Fresh_Website.png" title='Abrupt_Paste'/>
<img src="nfts/Friendly_Dvd.png" title='Abrupt_Paste'/>
<img src="nfts/Friendly_Hyperlink.png" title='Abrupt_Paste'/>
<img src="nfts/Friendly_Keyboard.png" title='Abrupt_Paste'/>
<img src="nfts/Friendly_Protocol.png" title='Abrupt_Paste'/>
<img src="nfts/Friendly_Spam.png" title='Abrupt_Paste'/>
<img src="nfts/Frightened_File.png" title='Abrupt_Paste'/>
<img src="nfts/Frightened_Keyboard.png" title='Abrupt_Paste'/>
<img src="nfts/Frightened_Node.png" title='Abrupt_Paste'/>
<img src="nfts/Frightened_Spam.png" title='Abrupt_Paste'/>
<img src="nfts/Frothy_Kernel.png" title='Abrupt_Paste'/>
<img src="nfts/Frothy_Table.png" title='Abrupt_Paste'/>
<img src="nfts/Frustrating_Hyperlink.png" title='Abrupt_Paste'/>
<img src="nfts/Fuzzy_Desktop.png" title='Abrupt_Paste'/>
<img src="nfts/Fuzzy_Iteration.png" title='Abrupt_Paste'/>
<img src="nfts/Fuzzy_Upload.png" title='Abrupt_Paste'/>
<img src="nfts/Gaudy_Lurking.png" title='Abrupt_Paste'/>
<img src="nfts/Gaudy_Typeface.png" title='Abrupt_Paste'/>
<img src="nfts/Gentle_Surf.png" title='Abrupt_Paste'/>
<img src="nfts/Ghastly_Analog.png" title='Abrupt_Paste'/>
<img src="nfts/Ghastly_Toolbar.png" title='Abrupt_Paste'/>
<img src="nfts/Giddy_Java.png" title='Abrupt_Paste'/>
<img src="nfts/Giddy_Protocol.png" title='Abrupt_Paste'/>
<img src="nfts/Giddy_Storage.png" title='Abrupt_Paste'/>
<img src="nfts/Gigantic_Dns_.png" title='Abrupt_Paste'/>
<img src="nfts/Gigantic_Emoticon.png" title='Abrupt_Paste'/>
<img src="nfts/Gigantic_Media.png" title='Abrupt_Paste'/>
<img src="nfts/Gigantic_Script.png" title='Abrupt_Paste'/>
<img src="nfts/Glamorous_Enter.png" title='Abrupt_Paste'/>
<img src="nfts/Glamorous_Frame.png" title='Abrupt_Paste'/>
<img src="nfts/Gleaming_Binary.png" title='Abrupt_Paste'/>
<img src="nfts/Gleaming_Cd.png" title='Abrupt_Paste'/>
<img src="nfts/Gleaming_Copy.png" title='Abrupt_Paste'/>
<img src="nfts/Gleaming_Dns_.png" title='Abrupt_Paste'/>
<img src="nfts/Gleaming_Media.png" title='Abrupt_Paste'/>
<img src="nfts/Gleaming_Program.png" title='Abrupt_Paste'/>
<img src="nfts/Glorious_Broadband.png" title='Abrupt_Paste'/>
<img src="nfts/Glorious_Page.png" title='Abrupt_Paste'/>
<img src="nfts/Gorgeous_Flash.png" title='Abrupt_Paste'/>
<img src="nfts/Gorgeous_Phishing.png" title='Abrupt_Paste'/>
<img src="nfts/Graceful_Cyberspace.png" title='Abrupt_Paste'/>
<img src="nfts/Graceful_Motherboard.png" title='Abrupt_Paste'/>
<img src="nfts/Graceful_Platform.png" title='Abrupt_Paste'/>
<img src="nfts/Graceful_Web.png" title='Abrupt_Paste'/>
<img src="nfts/Greasy_Cookie.png" title='Abrupt_Paste'/>
<img src="nfts/Greasy_Hypertext.png" title='Abrupt_Paste'/>
<img src="nfts/Greasy_Typeface.png" title='Abrupt_Paste'/>
<img src="nfts/Grieving_Delete.png" title='Abrupt_Paste'/>
<img src="nfts/Grieving_Paste.png" title='Abrupt_Paste'/>
<img src="nfts/Gritty_Dashboard.png" title='Abrupt_Paste'/>
<img src="nfts/Gritty_Login.png" title='Abrupt_Paste'/>
<img src="nfts/Gritty_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Grotesque_Hardware.png" title='Abrupt_Paste'/>
<img src="nfts/Grubby_Spyware.png" title='Abrupt_Paste'/>
<img src="nfts/Grumpy_Debug.png" title='Abrupt_Paste'/>
<img src="nfts/Grumpy_Drag.png" title='Abrupt_Paste'/>
<img src="nfts/Grumpy_Path.png" title='Abrupt_Paste'/>
<img src="nfts/Grumpy_Screenshot.png" title='Abrupt_Paste'/>
<img src="nfts/Grumpy_Url.png" title='Abrupt_Paste'/>
<img src="nfts/Handsome_Byte.png" title='Abrupt_Paste'/>
<img src="nfts/Happy_Bus.png" title='Abrupt_Paste'/>
<img src="nfts/Happy_Cd.png" title='Abrupt_Paste'/>
<img src="nfts/Happy_Media.png" title='Abrupt_Paste'/>
<img src="nfts/Happy_Reboot.png" title='Abrupt_Paste'/>
<img src="nfts/Happy_Www.png" title='Abrupt_Paste'/>
<img src="nfts/Harebrained_Real-time.png" title='Abrupt_Paste'/>
<img src="nfts/Healthy_Virtual.png" title='Abrupt_Paste'/>
<img src="nfts/Helpful_Dns_.png" title='Abrupt_Paste'/>
<img src="nfts/Helpful_Domain.png" title='Abrupt_Paste'/>
<img src="nfts/Helpful_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Helpful_Multimedia.png" title='Abrupt_Paste'/>
<img src="nfts/Helpful_Pirate.png" title='Abrupt_Paste'/>
<img src="nfts/Helpless_Bite.png" title='Abrupt_Paste'/>
<img src="nfts/Helpless_Linux.png" title='Abrupt_Paste'/>
<img src="nfts/Helpless_Path.png" title='Abrupt_Paste'/>
<img src="nfts/High_Cybercrime.png" title='Abrupt_Paste'/>
<img src="nfts/High_Freeware.png" title='Abrupt_Paste'/>
<img src="nfts/High_Plug-in.png" title='Abrupt_Paste'/>
<img src="nfts/Hollow_Decompress.png" title='Abrupt_Paste'/>
<img src="nfts/Hollow_Download.png" title='Abrupt_Paste'/>
<img src="nfts/Hollow_Java.png" title='Abrupt_Paste'/>
<img src="nfts/Hollow_Node.png" title='Abrupt_Paste'/>
<img src="nfts/Hollow_Pop-up.png" title='Abrupt_Paste'/>
<img src="nfts/Homely_Macro.png" title='Abrupt_Paste'/>
<img src="nfts/Homely_Multimedia.png" title='Abrupt_Paste'/>
<img src="nfts/Horrific_Frame.png" title='Abrupt_Paste'/>
<img src="nfts/Horrific_Hacker.png" title='Abrupt_Paste'/>
<img src="nfts/Huge_Encryption.png" title='Abrupt_Paste'/>
<img src="nfts/Huge_Scroll.png" title='Abrupt_Paste'/>
<img src="nfts/Hungry_Modem.png" title='Abrupt_Paste'/>
<img src="nfts/Hurt_Digital.png" title='Abrupt_Paste'/>
<img src="nfts/Hurt_Www.png" title='Abrupt_Paste'/>
<img src="nfts/Icy_Typeface.png" title='Abrupt_Paste'/>
<img src="nfts/Ideal_Binary.png" title='Abrupt_Paste'/>
<img src="nfts/Ideal_Integer.png" title='Abrupt_Paste'/>
<img src="nfts/Ideal_Logic.png" title='Abrupt_Paste'/>
<img src="nfts/Ideal_Qwerty.png" title='Abrupt_Paste'/>
<img src="nfts/Immense_Cypherpunk.png" title='Abrupt_Paste'/>
<img src="nfts/Immense_Reboot.png" title='Abrupt_Paste'/>
<img src="nfts/Impressionable_Buffer.png" title='Abrupt_Paste'/>
<img src="nfts/Impressionable_Desktop.png" title='Abrupt_Paste'/>
<img src="nfts/Intrigued_Hardware.png" title='Abrupt_Paste'/>
<img src="nfts/Intrigued_Save.png" title='Abrupt_Paste'/>
<img src="nfts/Intrigued_Shareware.png" title='Abrupt_Paste'/>
<img src="nfts/Intrigued_Wireless.png" title='Abrupt_Paste'/>
<img src="nfts/Intrigued_Zip.png" title='Abrupt_Paste'/>
<img src="nfts/Irate_Bitmap.png" title='Abrupt_Paste'/>
<img src="nfts/Irate_Security.png" title='Abrupt_Paste'/>
<img src="nfts/Irritable_Firmware.png" title='Abrupt_Paste'/>
<img src="nfts/Irritable_Screenshot.png" title='Abrupt_Paste'/>
<img src="nfts/Itchy_Keyword.png" title='Abrupt_Paste'/>
<img src="nfts/Itchy_Path.png" title='Abrupt_Paste'/>
<img src="nfts/Itchy_Queue.png" title='Abrupt_Paste'/>
<img src="nfts/Itchy_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Jealous_Application.png" title='Abrupt_Paste'/>
<img src="nfts/Jealous_Hyperlink.png" title='Abrupt_Paste'/>
<img src="nfts/Jealous_Keyboard.png" title='Abrupt_Paste'/>
<img src="nfts/Jealous_Reboot.png" title='Abrupt_Paste'/>
<img src="nfts/Jittery_Runtime.png" title='Abrupt_Paste'/>
<img src="nfts/Jittery_Teminal.png" title='Abrupt_Paste'/>
<img src="nfts/Jolly_Flaming.png" title='Abrupt_Paste'/>
<img src="nfts/Jolly_Unix.png" title='Abrupt_Paste'/>
<img src="nfts/Joyous_Hyperlink.png" title='Abrupt_Paste'/>
<img src="nfts/Joyous_Storage.png" title='Abrupt_Paste'/>
<img src="nfts/Joyous_Tag.png" title='Abrupt_Paste'/>
<img src="nfts/Joyous_Widget.png" title='Abrupt_Paste'/>
<img src="nfts/Juicy_Monitor.png" title='Abrupt_Paste'/>
<img src="nfts/Kind_Enter.png" title='Abrupt_Paste'/>
<img src="nfts/Kind_Scroll.png" title='Abrupt_Paste'/>
<img src="nfts/Kind_Tag.png" title='Abrupt_Paste'/>
<img src="nfts/Lackadaisical_Utility.png" title='Abrupt_Paste'/>
<img src="nfts/Large_Linux.png" title='Abrupt_Paste'/>
<img src="nfts/Lazy_Cd.png" title='Abrupt_Paste'/>
<img src="nfts/Little_Dvd.png" title='Abrupt_Paste'/>
<img src="nfts/Little_Queue.png" title='Abrupt_Paste'/>
<img src="nfts/Little_Shareware.png" title='Abrupt_Paste'/>
<img src="nfts/Lively_Boot.png" title='Abrupt_Paste'/>
<img src="nfts/Lively_Byte.png" title='Abrupt_Paste'/>
<img src="nfts/Lively_Scroll.png" title='Abrupt_Paste'/>
<img src="nfts/Loose_App.png" title='Abrupt_Paste'/>
<img src="nfts/Loose_Pop-up.png" title='Abrupt_Paste'/>
<img src="nfts/Lovely_Linux.png" title='Abrupt_Paste'/>
<img src="nfts/Lovely_Mainframe.png" title='Abrupt_Paste'/>
<img src="nfts/Lucky_Memory.png" title='Abrupt_Paste'/>
<img src="nfts/Lucky_Protocol.png" title='Abrupt_Paste'/>
<img src="nfts/Ludicrous_Storage.png" title='Abrupt_Paste'/>
<img src="nfts/Ludicrous_Wireless.png" title='Abrupt_Paste'/>
<img src="nfts/Magnificent_Password.png" title='Abrupt_Paste'/>
<img src="nfts/Mammoth_Teminal.png" title='Abrupt_Paste'/>
<img src="nfts/Maniacal_Bitmap.png" title='Abrupt_Paste'/>
<img src="nfts/Massive_Iteration.png" title='Abrupt_Paste'/>
<img src="nfts/Melancholy_Cybercrime.png" title='Abrupt_Paste'/>
<img src="nfts/Melancholy_Decompress.png" title='Abrupt_Paste'/>
<img src="nfts/Melancholy_Hacker.png" title='Abrupt_Paste'/>
<img src="nfts/Miniature_File.png" title='Abrupt_Paste'/>
<img src="nfts/Miniature_Scroll.png" title='Abrupt_Paste'/>
<img src="nfts/Miniature_Tag.png" title='Abrupt_Paste'/>
<img src="nfts/Minute_Process.png" title='Abrupt_Paste'/>
<img src="nfts/Minute_Root.png" title='Abrupt_Paste'/>
<img src="nfts/Minute_Www.png" title='Abrupt_Paste'/>
<img src="nfts/Misty_Flowchart.png" title='Abrupt_Paste'/>
<img src="nfts/Mortified_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Motionless_Backup.png" title='Abrupt_Paste'/>
<img src="nfts/Motionless_Email.png" title='Abrupt_Paste'/>
<img src="nfts/Motionless_Online.png" title='Abrupt_Paste'/>
<img src="nfts/Muddy_Modem.png" title='Abrupt_Paste'/>
<img src="nfts/Narrow_Username.png" title='Abrupt_Paste'/>
<img src="nfts/Nasty_Array.png" title='Abrupt_Paste'/>
<img src="nfts/Nervous_Qwerty.png" title='Abrupt_Paste'/>
<img src="nfts/Nonchalant_Hacker.png" title='Abrupt_Paste'/>
<img src="nfts/Oblivious_Database.png" title='Abrupt_Paste'/>
<img src="nfts/Oblivious_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Oblivious_Paste.png" title='Abrupt_Paste'/>
<img src="nfts/Obnoxious_Host.png" title='Abrupt_Paste'/>
<img src="nfts/Obnoxious_Page.png" title='Abrupt_Paste'/>
<img src="nfts/Odd_Flowchart.png" title='Abrupt_Paste'/>
<img src="nfts/Odd_Hypertext.png" title='Abrupt_Paste'/>
<img src="nfts/Odd_Scanner.png" title='Abrupt_Paste'/>
<img src="nfts/Old-fashioned_Application.png" title='Abrupt_Paste'/>
<img src="nfts/Old-fashioned_Icon.png" title='Abrupt_Paste'/>
<img src="nfts/Old-fashioned_Trash.png" title='Abrupt_Paste'/>
<img src="nfts/Outrageous_Captcha.png" title='Abrupt_Paste'/>
<img src="nfts/Outrageous_Inbox.png" title='Abrupt_Paste'/>
<img src="nfts/Perfect_Hacker.png" title='Abrupt_Paste'/>
<img src="nfts/Perfect_Router.png" title='Abrupt_Paste'/>
<img src="nfts/Petite_Computer.png" title='Abrupt_Paste'/>
<img src="nfts/Petite_Firmware.png" title='Abrupt_Paste'/>
<img src="nfts/Plain_Email.png" title='Abrupt_Paste'/>
<img src="nfts/Pleasant_Gigabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Pleasant_Wireless.png" title='Abrupt_Paste'/>
<img src="nfts/Precious_Cpu_.png" title='Abrupt_Paste'/>
<img src="nfts/Precious_Software.png" title='Abrupt_Paste'/>
<img src="nfts/Prickly_Spam.png" title='Abrupt_Paste'/>
<img src="nfts/Pungent_Flash.png" title='Abrupt_Paste'/>
<img src="nfts/Puny_Web.png" title='Abrupt_Paste'/>
<img src="nfts/Quizzical_Browser.png" title='Abrupt_Paste'/>
<img src="nfts/Quizzical_Script.png" title='Abrupt_Paste'/>
<img src="nfts/Reassured_Inbox.png" title='Abrupt_Paste'/>
<img src="nfts/Reassured_Kernel.png" title='Abrupt_Paste'/>
<img src="nfts/Reassured_Net.png" title='Abrupt_Paste'/>
<img src="nfts/Ripe_Print.png" title='Abrupt_Paste'/>
<img src="nfts/Robust_Queue.png" title='Abrupt_Paste'/>
<img src="nfts/Rotten_Document.png" title='Abrupt_Paste'/>
<img src="nfts/Rotund_Resolution.png" title='Abrupt_Paste'/>
<img src="nfts/Rough_Ram.png" title='Abrupt_Paste'/>
<img src="nfts/Rough_Utility.png" title='Abrupt_Paste'/>
<img src="nfts/Rough_Web.png" title='Abrupt_Paste'/>
<img src="nfts/Round_Real-time.png" title='Abrupt_Paste'/>
<img src="nfts/Salty_Mainframe.png" title='Abrupt_Paste'/>
<img src="nfts/Scant_Array.png" title='Abrupt_Paste'/>
<img src="nfts/Scant_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Scary_Computer.png" title='Abrupt_Paste'/>
<img src="nfts/Scary_Encryption.png" title='Abrupt_Paste'/>
<img src="nfts/Scary_Scan.png" title='Abrupt_Paste'/>
<img src="nfts/Scattered_Dns_.png" title='Abrupt_Paste'/>
<img src="nfts/Scattered_Dvd.png" title='Abrupt_Paste'/>
<img src="nfts/Scattered_Typeface.png" title='Abrupt_Paste'/>
<img src="nfts/Scrawny_Bug.png" title='Abrupt_Paste'/>
<img src="nfts/Scrawny_Programmer.png" title='Abrupt_Paste'/>
<img src="nfts/Selfish_Dns_.png" title='Abrupt_Paste'/>
<img src="nfts/Selfish_Router.png" title='Abrupt_Paste'/>
<img src="nfts/Shaggy_Teminal.png" title='Abrupt_Paste'/>
<img src="nfts/Shallow_Host.png" title='Abrupt_Paste'/>
<img src="nfts/Shiny_Podcast.png" title='Abrupt_Paste'/>
<img src="nfts/Short_Real-time.png" title='Abrupt_Paste'/>
<img src="nfts/Silky_Document.png" title='Abrupt_Paste'/>
<img src="nfts/Silly_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Skinny_Buffer.png" title='Abrupt_Paste'/>
<img src="nfts/Skinny_Flaming.png" title='Abrupt_Paste'/>
<img src="nfts/Slimy_Backup.png" title='Abrupt_Paste'/>
<img src="nfts/Slimy_Protocol.png" title='Abrupt_Paste'/>
<img src="nfts/Slimy_Version.png" title='Abrupt_Paste'/>
<img src="nfts/Slippery_Dot.png" title='Abrupt_Paste'/>
<img src="nfts/Small_Configure.png" title='Abrupt_Paste'/>
<img src="nfts/Small_Data.png" title='Abrupt_Paste'/>
<img src="nfts/Small_Flaming.png" title='Abrupt_Paste'/>
<img src="nfts/Small_Icon.png" title='Abrupt_Paste'/>
<img src="nfts/Smiling_Folder.png" title='Abrupt_Paste'/>
<img src="nfts/Smoggy_Cypherpunk.png" title='Abrupt_Paste'/>
<img src="nfts/Smoggy_Monitor.png" title='Abrupt_Paste'/>
<img src="nfts/Smoggy_Spam.png" title='Abrupt_Paste'/>
<img src="nfts/Smooth_Buffer.png" title='Abrupt_Paste'/>
<img src="nfts/Smug_Cypherpunk.png" title='Abrupt_Paste'/>
<img src="nfts/Smug_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Smug_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Smug_Upload.png" title='Abrupt_Paste'/>
<img src="nfts/Soggy_Disk.png" title='Abrupt_Paste'/>
<img src="nfts/Soggy_Security.png" title='Abrupt_Paste'/>
<img src="nfts/Soggy_Terabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Solid_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Solid_Qwerty.png" title='Abrupt_Paste'/>
<img src="nfts/Sour_Folder.png" title='Abrupt_Paste'/>
<img src="nfts/Sour_Privacy.png" title='Abrupt_Paste'/>
<img src="nfts/Sparkling_Cache.png" title='Abrupt_Paste'/>
<img src="nfts/Sparkling_Exabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Spicy_Compress.png" title='Abrupt_Paste'/>
<img src="nfts/Spicy_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Spicy_Integer.png" title='Abrupt_Paste'/>
<img src="nfts/Spicy_Path.png" title='Abrupt_Paste'/>
<img src="nfts/Splendid_Joystick.png" title='Abrupt_Paste'/>
<img src="nfts/Spotless_Net.png" title='Abrupt_Paste'/>
<img src="nfts/Spotless_Windows.png" title='Abrupt_Paste'/>
<img src="nfts/Spotless_Workstation.png" title='Abrupt_Paste'/>
<img src="nfts/Square_Database.png" title='Abrupt_Paste'/>
<img src="nfts/Stale_Multimedia.png" title='Abrupt_Paste'/>
<img src="nfts/Stale_Windows.png" title='Abrupt_Paste'/>
<img src="nfts/Steady_File.png" title='Abrupt_Paste'/>
<img src="nfts/Steep_Exabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Stout_App.png" title='Abrupt_Paste'/>
<img src="nfts/Stout_Array.png" title='Abrupt_Paste'/>
<img src="nfts/Stout_Gigabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Strange_Programmer.png" title='Abrupt_Paste'/>
<img src="nfts/Strong_Flash.png" title='Abrupt_Paste'/>
<img src="nfts/Stunning_Compress.png" title='Abrupt_Paste'/>
<img src="nfts/Substantial_Algorithm.png" title='Abrupt_Paste'/>
<img src="nfts/Substantial_Program.png" title='Abrupt_Paste'/>
<img src="nfts/Successful_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Succulent_Debug.png" title='Abrupt_Paste'/>
<img src="nfts/Superficial_Lurking.png" title='Abrupt_Paste'/>
<img src="nfts/Superficial_Online.png" title='Abrupt_Paste'/>
<img src="nfts/Swanky_Drag.png" title='Abrupt_Paste'/>
<img src="nfts/Swanky_Dvd.png" title='Abrupt_Paste'/>
<img src="nfts/Tart_Xml.png" title='Abrupt_Paste'/>
<img src="nfts/Tasty_Document.png" title='Abrupt_Paste'/>
<img src="nfts/Tasty_Login.png" title='Abrupt_Paste'/>
<img src="nfts/Tender_Bit.png" title='Abrupt_Paste'/>
<img src="nfts/Tender_Byte.png" title='Abrupt_Paste'/>
<img src="nfts/Tense_Client.png" title='Abrupt_Paste'/>
<img src="nfts/Terrible_Folder.png" title='Abrupt_Paste'/>
<img src="nfts/Terrible_Table.png" title='Abrupt_Paste'/>
<img src="nfts/Thoughtless_Dashboard.png" title='Abrupt_Paste'/>
<img src="nfts/Tight_Hardware.png" title='Abrupt_Paste'/>
<img src="nfts/Tight_Integer.png" title='Abrupt_Paste'/>
<img src="nfts/Timely_Firewall.png" title='Abrupt_Paste'/>
<img src="nfts/Timely_Host.png" title='Abrupt_Paste'/>
<img src="nfts/Timely_Network.png" title='Abrupt_Paste'/>
<img src="nfts/Timely_Queue.png" title='Abrupt_Paste'/>
<img src="nfts/Timely_Version.png" title='Abrupt_Paste'/>
<img src="nfts/Tricky_Integer.png" title='Abrupt_Paste'/>
<img src="nfts/Tricky_Net.png" title='Abrupt_Paste'/>
<img src="nfts/Tricky_Wiki.png" title='Abrupt_Paste'/>
<img src="nfts/Trite_Option.png" title='Abrupt_Paste'/>
<img src="nfts/Troubled_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Uneven_Captcha.png" title='Abrupt_Paste'/>
<img src="nfts/Uneven_Dvd.png" title='Abrupt_Paste'/>
<img src="nfts/Uneven_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Unsightly_Computer.png" title='Abrupt_Paste'/>
<img src="nfts/Unsightly_Inbox.png" title='Abrupt_Paste'/>
<img src="nfts/Unsightly_Mainframe.png" title='Abrupt_Paste'/>
<img src="nfts/Upset_Encryption.png" title='Abrupt_Paste'/>
<img src="nfts/Uptight_Graphics.png" title='Abrupt_Paste'/>
<img src="nfts/Uptight_Hardware.png" title='Abrupt_Paste'/>
<img src="nfts/Vexed_Scanner.png" title='Abrupt_Paste'/>
<img src="nfts/Victorious_Integer.png" title='Abrupt_Paste'/>
<img src="nfts/Victorious_Kernel.png" title='Abrupt_Paste'/>
<img src="nfts/Victorious_Reboot.png" title='Abrupt_Paste'/>
<img src="nfts/Vivacious_Thread.png" title='Abrupt_Paste'/>
<img src="nfts/Vivacious_Xml.png" title='Abrupt_Paste'/>
<img src="nfts/Wacky_Shell.png" title='Abrupt_Paste'/>
<img src="nfts/Weary_Process.png" title='Abrupt_Paste'/>
<img src="nfts/Whimsical_Bitmap.png" title='Abrupt_Paste'/>
<img src="nfts/Whimsical_Delete.png" title='Abrupt_Paste'/>
<img src="nfts/Whimsical_Macro.png" title='Abrupt_Paste'/>
<img src="nfts/Whimsical_Portal.png" title='Abrupt_Paste'/>
<img src="nfts/Whimsical_Shift.png" title='Abrupt_Paste'/>
<img src="nfts/Whopping_Emoticon.png" title='Abrupt_Paste'/>
<img src="nfts/Witty_Gigabyte.png" title='Abrupt_Paste'/>
<img src="nfts/Witty_Net.png" title='Abrupt_Paste'/>
<img src="nfts/Witty_Window.png" title='Abrupt_Paste'/>
<img src="nfts/Wonderful_Command.png" title='Abrupt_Paste'/>
<img src="nfts/Wonderful_Storage.png" title='Abrupt_Paste'/>
<img src="nfts/Zany_Runtime.png" title='Abrupt_Paste'/>
<img src="nfts/Zealous_Bookmark.png" title='Abrupt_Paste'/>
<img src="nfts/Zealous_Platform.png" title='Abrupt_Paste'/>
<img src="nfts/Zippy_Online.png" title='Abrupt_Paste'/>
<img src="nfts/Zippy_Program.png" title='Abrupt_Paste'/>
<img src="nfts/Zippy_Screen.png" title='Abrupt_Paste'/>
<img src="nfts/Zippy_Www.png" title='Abrupt_Paste'/>
 </div>



            <footer class="colorme" style={{padding:64}}>
               <h4 style={{padding:5}}>FAQ</h4>
            <br/>
            <br/>
            <ul id="faq">
              <li>
                 <p>
                 <strong>
                 🙋‍♂️  Why are there 502 Mars-Shot-Bots available?
                 </strong>
                 <br/>
                 Because Elon said so
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♀️ When was this project launched?
                 </strong>
                 <br/>
                 10/4/21 after an extensive rescue mission.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️ Why was this project launched?
                 </strong>
                 <br/>
                 Simpl FOMOd cause he was priced out of MSB.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♀️ How many can I mint?
                 </strong>
                 <br/>
                 You are welcome to purchase 5 Mars-Shot Bots!    
                 <br/>
                 <br/>
                 Karma FTW!             </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️ How is the price calculated?
                 </strong>
                 <br/>
                 These PFPs are minted on a bonding curve that increases ~1.2% each purchase, and starts with a price of 0.0033 ETH.  Here new curvbe!:
                 <br/>
                 <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vTI29iQh565K6GykQDplsmYM9-84LB7L2dumXBe_7oaoF8lfb3L-4wgzNyur7wRKFhQBPFHLWK5S30z/pubchart?oid=202580104&format=image">
                  <img src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTI29iQh565K6GykQDplsmYM9-84LB7L2dumXBe_7oaoF8lfb3L-4wgzNyur7wRKFhQBPFHLWK5S30z/pubchart?oid=202580104&format=image" class="chart"/>
                  </a>

                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♀️Where does the ETH go when I purchase a Mars-Shot-Bots?
                 </strong>
                 <br/>
                100% of funds will go to the <a href="https://etherscan.io/address/0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6">Gitcoin Grants Multisig</a> to fund public goods on Gitcoin.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️Which Mars-Shot Bots are the rarest?
                 </strong>
                 <br/>
                  Mandala Bots! ~ 24 %
                  Other rarities may bubble to the surface!
                 <br/>                 
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️ Whats the Moonshot Collective?
                 </strong>
                 <br/>
                 It's the prototyping workstream of the GitcoinDAO.  For more information, <a href="https://moonshotcollective.space">click here</a>.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️What else should we know?
                 </strong>
                 <br/>
                 <a href="https://gitcoin.co/grants/">Gitcoin Grants Round 11</a> starts September 8th!  It's going to have new discoverability features, new checkout options, and will feature the launch of <a href="https://github.com/dcgtc/dgrants">dGrants</a>, the first decentralized Gitcoin Grants Round.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️I has another question, where can I get in touch?
                 </strong>
                 <br/>
                 Tweet at me; <a href="https://twitter.com/nowonderer">@nowonderer</a> 
                 </p>
              </li>


            </ul>
            <br/>      
              |        
              <a style={{padding:8}} href="broken">On OpenSea sometime soon?</a>    
              |
              <a style={{padding:8}} href="https://t.me/joinchat/v6N_GHY-8kU3ZmRh">Telegram</a>
              |
              <a style={{padding:8}} href="https://discord.gg/ACKb28pSSP">Discord</a>
              |
              <a style={{padding:8}} href="https://moonshotcollective.space">Moonshot Collective</a>
              |
              Art by <a style={{padding:8}} href="https://gitcoin.co/octaviaan">@octaviaan</a>/<a style={{padding:8}} href="https://twitter.com/nowonderer">@nowonderer</a> / <a style={{padding:8}} href="https://twitter.com/Ruth_chapa">@ruth_chapa</a>
                       
            <br/>
            <img src='builtoneth.png'/>
            <br/>

              </footer>


          </Route>


          <Route path="/transfers">
            <div style={{ width:600, margin: "auto", marginTop:32, paddingBottom:32 }}>
              <List
                bordered
                dataSource={transferEvents}
                renderItem={(item) => {
                  return (
                    <List.Item key={item[0]+"_"+item[1]+"_"+item.blockNumber+"_"+item[2].toNumber()}>
                      <span style={{fontSize:16, marginRight:8}}>#{item[2].toNumber()}</span>
                      <Address
                          address={item[0]}
                          ensProvider={mainnetProvider}
                          fontSize={16}
                      /> =>
                      <Address
                          address={item[1]}
                          ensProvider={mainnetProvider}
                          fontSize={16}
                      />
                    </List.Item>
                  )
                }}
              />
            </div>
          </Route>

          <Route path="/ipfsup">
            <div style={{ paddingTop:32, width:740, margin:"auto", textAlign:"left" }}>
              <ReactJson
                style={{ padding:8 }}
                src={yourJSON}
                theme={"pop"}
                enableClipboard={false}
                onEdit={(edit,a)=>{
                  setYourJSON(edit.updated_src)
                }}
                onAdd={(add,a)=>{
                  setYourJSON(add.updated_src)
                }}
                onDelete={(del,a)=>{
                  setYourJSON(del.updated_src)
                }}
              />
            </div>

            <Button style={{margin:8}} loading={sending} size="large" shape="round" type="primary" onClick={async()=>{
                console.log("UPLOADING...",yourJSON)
                setSending(true)
                setIpfsHash()
                const result = await ipfs.add(JSON.stringify(yourJSON))//addToIPFS(JSON.stringify(yourJSON))
                if(result && result.path) {
                  setIpfsHash(result.path)
                }
                setSending(false)
                console.log("RESULT:",result)
            }}>Upload to IPFS</Button>

            <div  style={{padding:16,paddingBottom:150}}>
              {ipfsHash}
            </div>

          </Route>
          <Route path="/ipfsdown">
              <div style={{ paddingTop:32, width:740, margin:"auto" }}>
                <Input
                  value={ipfsDownHash}
                  placeHolder={"IPFS hash (like QmadqNw8zkdrrwdtPFK1pLi8PPxmkQ4pDJXY8ozHtz6tZq)"}
                  onChange={(e)=>{
                    setIpfsDownHash(e.target.value)
                  }}
                />
              </div>
              <Button style={{margin:8}} loading={sending} size="large" shape="round" type="primary" onClick={async()=>{
                  console.log("DOWNLOADING...",ipfsDownHash)
                  setDownloading(true)
                  setIpfsContent()
                  const result = await getFromIPFS(ipfsDownHash)//addToIPFS(JSON.stringify(yourJSON))
                  if(result && result.toString) {
                    setIpfsContent(result.toString())
                  }
                  setDownloading(false)
              }}>Download from IPFS</Button>

              <pre  style={{padding:16, width:500, margin:"auto",paddingBottom:150}}>
                {ipfsContent}
              </pre>
          </Route>
          <Route path="/debugcontracts">
              <Contract
                name="MarsShotBots"
                signer={userProvider.getSigner()}
                provider={localProvider}
                address={address}
                blockExplorer={blockExplorer}
              />
          </Route>
        </Switch>
      </BrowserRouter>

      {/*}<ThemeSwitch />*/}


      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
         <Account
           address={address}
           localProvider={localProvider}
           userProvider={userProvider}
           mainnetProvider={mainnetProvider}
           price={price}
           web3Modal={web3Modal}
           loadWeb3Modal={loadWeb3Modal}
           logoutOfWeb3Modal={logoutOfWeb3Modal}
           blockExplorer={blockExplorer}
         />
         {faucetHint}
      </div>

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
       <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
         <Row align="middle" gutter={[4, 4]}>
           <Col span={8}>
             <Ramp price={price} address={address} networks={NETWORKS}/>
           </Col>

           <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
             <GasGauge gasPrice={gasPrice} />
           </Col>
           <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
             <Button
               onClick={() => {
                 window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
               }}
               size="large"
               shape="round"
             >
               <span style={{ marginRight: 8 }} role="img" aria-label="support">
                 💬
               </span>
               Support
             </Button>
           </Col>
         </Row>

         <Row align="middle" gutter={[4, 4]}>
           <Col span={24}>
             {
               /*  if the local provider has a signer, let's show the faucet:  */
               faucetAvailable ? (
                 <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider}/>
               ) : (
                 ""
               )
             }
           </Col>
         </Row>
       </div>

    </div>
  );
}


/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  // network: "mainnet", // optional
  cacheProvider: true, // optional
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: INFURA_ID,
      },
    },
  },
});

const logoutOfWeb3Modal = async () => {
  await web3Modal.clearCachedProvider();
  setTimeout(() => {
    window.location.reload();
  }, 1);
};

 window.ethereum && window.ethereum.on('chainChanged', chainId => {
  setTimeout(() => {
    window.location.reload();
  }, 1);
})

export default App;