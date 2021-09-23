import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Switch, Route, Link } from "react-router-dom";
import "antd/dist/antd.css";
import {  JsonRpcProvider, Web3Provider } from "@ethersproject/providers";
import {  LinkOutlined } from "@ant-design/icons"
import "./App.css";
import { Row, Col, Button, Menu, Alert, Input, List, Card, Switch as SwitchD } from "antd";
import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { useUserAddress } from "eth-hooks";
import { useExchangePrice, useGasPrice, useUserProvider, useContractLoader, useContractReader, useEventListener, useBalance, useExternalContractLoader } from "./hooks";
import { Header, Account, Faucet, Ramp, Contract, GasGauge, Address, AddressInput, ThemeSwitch } from "./components";
import { Transactor } from "./helpers";
import { formatEther, parseEther } from "@ethersproject/units";
import { utils, ethers } from "ethers";
//import Hints from "./Hints";
import { Hints, ExampleUI, Subgraph } from "./views"
import { useThemeSwitcher } from "react-css-theme-switcher";
import { INFURA_ID, DAI_ADDRESS, DAI_ABI, NETWORK, NETWORKS } from "./constants";
import StackGrid from "react-stack-grid";
import ReactJson from 'react-json-view'
import assets from './assets.js'

const { BufferList } = require('bl')
// https://www.npmjs.com/package/ipfs-http-client
const ipfsAPI = require('ipfs-http-client');
const ipfs = ipfsAPI({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })

console.log("📦 Assets: ",assets)

/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/


/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS['rinkeby']; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true

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
const mainnetInfura = new JsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
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
  const yourMainnetBalance = useBalance(mainnetProvider, address);
  if(DEBUG) console.log("💵 yourMainnetBalance",yourMainnetBalance?formatEther(yourMainnetBalance):"...")

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider)
  if(DEBUG) console.log("📝 readContracts",readContracts)

  // If you want to make 🔐 write transactions to your contracts, use the userProvider:
  const writeContracts = useContractLoader(userProvider)
  if(DEBUG) console.log("🔐 writeContracts",writeContracts)

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetDAIContract = useExternalContractLoader(mainnetProvider, DAI_ADDRESS, DAI_ABI)
  console.log("🌍 DAI contract on mainnet:",mainnetDAIContract)
  //
  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader({DAI: mainnetDAIContract},"DAI", "balanceOf",["0x34aA3F359A9D614239015126635CE7732c18fDF3"])
  console.log("🥇 myMainnetDAIBalance:",myMainnetDAIBalance)


  // keep track of a variable from the contract in the local React state:
  const balance = useContractReader(readContracts,"MarsShotBots", "balanceOf", [ address ])
  console.log("🤗 balance:",balance)

  const priceToMint = useContractReader(readContracts,"MarsShotBots", "price")
  console.log("🤗 priceToMint:",priceToMint)


  //📟 Listen for broadcast events
  const transferEvents = useEventListener(readContracts, "MarsShotBots", "Transfer", localProvider, 1);
  console.log("📟 Transfer events:",transferEvents)



  //
  // 🧠 This effect will update yourCollectibles by polling when your balance changes
  //
  const yourBalance = balance && balance.toNumber && balance.toNumber()
  const [ yourCollectibles, setYourCollectibles ] = useState()

  useEffect(()=>{
    const updateYourCollectibles = async () => {
      let collectibleUpdate = []
      for(let tokenIndex=0;tokenIndex<balance;tokenIndex++){
        try{
          console.log("GEtting token index",tokenIndex)
          const tokenId = await readContracts.MarsShotBots.tokenOfOwnerByIndex(address, tokenIndex)
          console.log("tokenId",tokenId)
          const tokenURI = await readContracts.MarsShotBots.tokenURI(tokenId)
          console.log("tokenURI",tokenURI)

          const ipfsHash =  tokenURI.replace("https://forgottenbots.mypinata.cloud/ipfs/","")
          console.log("ipfsHash",ipfsHash)

          const jsonManifestBuffer = await getFromIPFS(ipfsHash)

          try{
            const jsonManifest = JSON.parse(jsonManifestBuffer.toString())
            console.log("jsonManifest",jsonManifest)
            collectibleUpdate.push({ id:tokenId, uri:tokenURI, owner: address, ...jsonManifest })
          }catch(e){console.log(e)}

        }catch(e){console.log(e)}
      }
      setYourCollectibles(collectibleUpdate)
    }
    updateYourCollectibles()
  },[ address, yourBalance ])

  /*
  const addressFromENS = useResolveName(mainnetProvider, "austingriffith.eth");
  console.log("🏷 Resolved austingriffith.eth as:",addressFromENS)
  */


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
  }else{
    networkDisplay = (
      <div style={{zIndex:-1, position:'absolute', right:154,top:28,padding:16,color:targetNetwork.color}}>
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
  if(!faucetClicked&&localProvider&&localProvider._network&&localProvider._network.chainId==31337&&yourLocalBalance&&formatEther(yourLocalBalance)<=0){
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

  const [ loadedAssets, setLoadedAssets ] = useState()
  useEffect(()=>{
    const updateYourCollectibles = async () => {
      let assetUpdate = []
      for(let a in assets){
        try{
          const forSale = await readContracts.YourCollectible.forSale(utils.id(a))
          let owner
          if(!forSale){
            const tokenId = await readContracts.YourCollectible.uriToTokenId(utils.id(a))
            owner = await readContracts.YourCollectible.ownerOf(tokenId)
          }
          assetUpdate.push({id:a,...assets[a],forSale:forSale,owner:owner})
        }catch(e){console.log(e)}
      }
      setLoadedAssets(assetUpdate)
    }
    if(readContracts && readContracts.YourCollectible) updateYourCollectibles()
  }, [ assets, readContracts, transferEvents ]);

  let galleryList = []
  for(let a in loadedAssets){
    console.log("loadedAssets",a,loadedAssets[a])

    let cardActions = []
    if(loadedAssets[a].forSale){
      cardActions.push(
        <div>
          <Button onClick={()=>{
            console.log("gasPrice,",gasPrice)
            tx( writeContracts.YourCollectible.mintItem(loadedAssets[a].id,{
              value: parseEther("1"),
              gasPrice:gasPrice
            }) )
          }}>
             BUY (1 ETH)
          </Button>
        </div>
      )
    }else{
      cardActions.push(
        <div>
          owned by: <Address
            address={loadedAssets[a].owner}
            ensProvider={mainnetProvider}
            blockExplorer={blockExplorer}
            minimized={true}
          />
        </div>
      )
    }

    galleryList.push(
      <Card style={{width:200}} key={loadedAssets[a].name}
        actions={cardActions}
        title={(
          <div>
            {loadedAssets[a].name} <a style={{cursor:"pointer",opacity:0.33}} href={loadedAssets[a].external_url} target="_blank"><LinkOutlined /></a>
          </div>
        )}
      >
        <img style={{maxWidth:130}} src={loadedAssets[a].image}/>
        <div style={{opacity:0.77}}>
          {loadedAssets[a].description}
        </div>
      </Card>
    )
  }

  return (
    <div className="App">

      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {networkDisplay}

      <BrowserRouter>


        <Switch>
          <Route exact path="/">
            {/*
                🎛 this scaffolding is full of commonly used components
                this <Contract/> component will automatically parse your ABI
                and give you a form to interact with it locally

            <div style={{ maxWidth:820, margin: "auto", marginTop:32, paddingBottom:256 }}>
              <StackGrid
                columnWidth={200}
                gutterWidth={16}
                gutterHeight={16}
              >
                {galleryList}
              </StackGrid>
            </div>
            */}


            <div class="colorme">
            <img class="logo_moonshot sub" src="Layton.png" />
            <img class="logo_moonshot" src="Danielle.png" />
            <img class="logo_moonshot sub" src="Elyse.png" />
            <br/>
            <h1 >Forgotten Moonshot Bots</h1>

            <h2>An ⭐️OMEGA-Rare⭐️ PFP (179 supply)</h2>
            <h2>Assets Created and ABANDONED 😭 by ya bois <a href="https://twitter.com/owocki">@owocki</a> & <a href="https://twitter.com/austingriffith">@austingriffith</a></h2>
            <h2>❤️🛠 Deployed on 9/19, after an extended rescue mission. </h2>
            <div style={{padding:32}}>
              <Button type={"primary"} onClick={async ()=>{
                let price = await readContracts.MarsShotBots.price()
                tx( writeContracts.MarsShotBots.requestMint(address,{value: price}) )
              }}>MINT for Ξ{priceToMint && (+ethers.utils.formatEther(priceToMint)).toFixed(4)}</Button>

              <div class="publicgoodsgood">
                <h2>🌱❤️*80% Proceeds To Public Goods❤️, 20% to simpl, who rescued these bots. He needs a rescue, too.🌱</h2>
                  🦧✊ <strong>Demand more from PFPs! 👇</strong> <br/>
                 🌱🌱 <strong>80%</strong> of MarsShotBots Minting Fees go to fund Ethereum Public Goods on Gitcoin Grants 🌱🌱  The other 20% goes to simpl who rescued the bots!<br/>
                 <strong>🦧✊🌱80%🌱✊🦧</strong>
              </div>
              <br/>
              <br/>
            </div>

            {yourCollectibles && yourCollectibles.length>0 ?
              <div></div>
              :
            <div class="colorme2">

            <h4 style={{padding:5}}>Why We Think MarsShotBots Rock:</h4>
            <br/>
            <br/>
            <ul class="rocks">
              <li>
               🤖🍠 These are the placeholder images and meta-datas abandoned by MoonshotCollective, and they deserve a home.
              </li>
              <li>
               🤖👑 Oh the Novelty!
              </li>
              <li>
               🤖🌱 80% Proceeds Support Public Goods! - 20% to the rescuer.
              </li>              
              <li>
               🤖❤️ Hang with your botfrens on <a  href="https://discord.gg/ACKb28pSSP">Discord</a> & <a href="https://t.me/joinchat/v6N_GHY-8kU3ZmRh">Telegram</a>
              </li>
              
            </ul>


            </div>
             }
    
            {yourCollectibles && yourCollectibles.length>0 ?
              <div></div>
              :
            <div class="colorme3">

            <h4 style={{padding:5}}>Testimonials:</h4>
            <br/>
            <br/>
            <div class='Testimonial'>
              <img src="Layton.png" />
              <h5>Layton (Rescued)</h5>
              <p>01100001 01110101 01110011 01110100 01101001 01101110 00100000 01110111 01101000 01111001 00100000 01100100 01101111</p>
            </div>
            <div class='Testimonial'>
              <img src="Danielle.png" />
              <h5>Simpl (Rescued)</h5>
              <p>bzzz bzzz bzz new fax incoming

kwwaaaaaaaaaaaaa

eeeeeuuuueeuuueeuuuu **denga denga**

we made our mistakes, but you didnt have to abandon us :(</p>
            </div>
            <div class='Testimonial'>
              <img src="Elyse.png" />
              <h5>Elyse (Rescued)</h5>
              <p>Beep Boop Bop Bop Moonshot Collective is not associated with my stupid antics Beep Boop Bot Boop Boop Bloop Beep  Boop Boop Bloop Beep </p>
            </div>


            </div>
             }


            </div>



            {yourCollectibles && yourCollectibles.length>0 ?
              <div style={{ width:640, margin: "auto", marginTop:32, padding:32 }}>
               <h4 style={{padding:5}}>Your MarsShotBots 🤖🚀🌕</h4>
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
              </div>:

            <div id="preview">
              <h4>Give these rescued bots a loving home 🤖🏠❤️</h4>
              <h4>These images may be broken bc IPFS is mean :(, be patient.</h4>
            <br/>
            <br/>

            <img src="nfts/Adelyn.png" title='Abrupt_Paste'/>
<img src="nfts/Adler.png" title='Abrupt_Paste'/>
<img src="nfts/Ahmir.png" title='Abrupt_Paste'/>
<img src="nfts/Alaya.png" title='Abrupt_Paste'/>
<img src="nfts/Albert.png" title='Abrupt_Paste'/>
<img src="nfts/Alden.png" title='Abrupt_Paste'/>
<img src="nfts/Alessandro.png" title='Abrupt_Paste'/>
<img src="nfts/Alex.png" title='Abrupt_Paste'/>
<img src="nfts/Alexis.png" title='Abrupt_Paste'/>
<img src="nfts/Alia.png" title='Abrupt_Paste'/>
<img src="nfts/Alyssa.png" title='Abrupt_Paste'/>
<img src="nfts/Amora.png" title='Abrupt_Paste'/>
<img src="nfts/Anakin.png" title='Abrupt_Paste'/>
<img src="nfts/Angelina.png" title='Abrupt_Paste'/>
<img src="nfts/Annabella.png" title='Abrupt_Paste'/>
<img src="nfts/Ariel.png" title='Abrupt_Paste'/>
<img src="nfts/Ariyah.png" title='Abrupt_Paste'/>
<img src="nfts/Arthur.png" title='Abrupt_Paste'/>
<img src="nfts/Axl.png" title='Abrupt_Paste'/>
<img src="nfts/Axton.png" title='Abrupt_Paste'/>
<img src="nfts/Belen.png" title='Abrupt_Paste'/>
<img src="nfts/Braden.png" title='Abrupt_Paste'/>
<img src="nfts/Bradley.png" title='Abrupt_Paste'/>
<img src="nfts/Brecken.png" title='Abrupt_Paste'/>
<img src="nfts/Brinley.png" title='Abrupt_Paste'/>
<img src="nfts/Brynlee.png" title='Abrupt_Paste'/>
<img src="nfts/Cairo.png" title='Abrupt_Paste'/>
<img src="nfts/Cal.png" title='Abrupt_Paste'/>
<img src="nfts/Callan.png" title='Abrupt_Paste'/>
<img src="nfts/Cameron.png" title='Abrupt_Paste'/>
<img src="nfts/Cannon.png" title='Abrupt_Paste'/>
<img src="nfts/Carlos.png" title='Abrupt_Paste'/>
<img src="nfts/Carly.png" title='Abrupt_Paste'/>
<img src="nfts/Case.png" title='Abrupt_Paste'/>
<img src="nfts/Casen.png" title='Abrupt_Paste'/>
<img src="nfts/Cayson.png" title='Abrupt_Paste'/>
<img src="nfts/Cesar.png" title='Abrupt_Paste'/>
<img src="nfts/Charlie.png" title='Abrupt_Paste'/>
<img src="nfts/Claire.png" title='Abrupt_Paste'/>
<img src="nfts/Clark.png" title='Abrupt_Paste'/>
<img src="nfts/Clementine.png" title='Abrupt_Paste'/>
<img src="nfts/Coen.png" title='Abrupt_Paste'/>
<img src="nfts/Corey.png" title='Abrupt_Paste'/>
<img src="nfts/Dakari.png" title='Abrupt_Paste'/>
<img src="nfts/Dallas.png" title='Abrupt_Paste'/>
<img src="nfts/Daniel.png" title='Abrupt_Paste'/>
<img src="nfts/Danielle.png" title='Abrupt_Paste'/>
<img src="nfts/Danny.png" title='Abrupt_Paste'/>
<img src="nfts/Darwin.png" title='Abrupt_Paste'/>
<img src="nfts/Davis.png" title='Abrupt_Paste'/>
<img src="nfts/Daxton.png" title='Abrupt_Paste'/>
<img src="nfts/Della.png" title='Abrupt_Paste'/>
<img src="nfts/Dominic.png" title='Abrupt_Paste'/>
<img src="nfts/Donald.png" title='Abrupt_Paste'/>
<img src="nfts/Dorian.png" title='Abrupt_Paste'/>
<img src="nfts/Dream.png" title='Abrupt_Paste'/>
<img src="nfts/Edwin.png" title='Abrupt_Paste'/>
<img src="nfts/Elaine.png" title='Abrupt_Paste'/>
<img src="nfts/Eliana.png" title='Abrupt_Paste'/>
<img src="nfts/Elianna.png" title='Abrupt_Paste'/>
<img src="nfts/Elizabeth.png" title='Abrupt_Paste'/>
<img src="nfts/Elliana.png" title='Abrupt_Paste'/>
<img src="nfts/Ellianna.png" title='Abrupt_Paste'/>
<img src="nfts/Elyse.png" title='Abrupt_Paste'/>
<img src="nfts/Evan.png" title='Abrupt_Paste'/>
<img src="nfts/Evangeline.png" title='Abrupt_Paste'/>
<img src="nfts/Eve.png" title='Abrupt_Paste'/>
<img src="nfts/Everett.png" title='Abrupt_Paste'/>
<img src="nfts/Evie.png" title='Abrupt_Paste'/>
<img src="nfts/Fallon.png" title='Abrupt_Paste'/>
<img src="nfts/Finley.png" title='Abrupt_Paste'/>
<img src="nfts/Gary.png" title='Abrupt_Paste'/>
<img src="nfts/Georgia.png" title='Abrupt_Paste'/>
<img src="nfts/Grace.png" title='Abrupt_Paste'/>
<img src="nfts/Halo.png" title='Abrupt_Paste'/>
<img src="nfts/Hana.png" title='Abrupt_Paste'/>
<img src="nfts/Hanna.png" title='Abrupt_Paste'/>
<img src="nfts/Hannah.png" title='Abrupt_Paste'/>
<img src="nfts/Harlow.png" title='Abrupt_Paste'/>
<img src="nfts/Harmony.png" title='Abrupt_Paste'/>
<img src="nfts/Hope.png" title='Abrupt_Paste'/>
<img src="nfts/Ian.png" title='Abrupt_Paste'/>
<img src="nfts/Ibrahim.png" title='Abrupt_Paste'/>
<img src="nfts/Indie.png" title='Abrupt_Paste'/>
<img src="nfts/Israel.png" title='Abrupt_Paste'/>
<img src="nfts/Izaiah.png" title='Abrupt_Paste'/>
<img src="nfts/Jake.png" title='Abrupt_Paste'/>
<img src="nfts/Jalen.png" title='Abrupt_Paste'/>
<img src="nfts/Jase.png" title='Abrupt_Paste'/>
<img src="nfts/Jaxtyn.png" title='Abrupt_Paste'/>
<img src="nfts/Jay.png" title='Abrupt_Paste'/>
<img src="nfts/Jeffrey.png" title='Abrupt_Paste'/>
<img src="nfts/Jianna.png" title='Abrupt_Paste'/>
<img src="nfts/Jude.png" title='Abrupt_Paste'/>
<img src="nfts/Judith.png" title='Abrupt_Paste'/>
<img src="nfts/Julian.png" title='Abrupt_Paste'/>
<img src="nfts/Julio.png" title='Abrupt_Paste'/>
<img src="nfts/Kade.png" title='Abrupt_Paste'/>
<img src="nfts/Kairi.png" title='Abrupt_Paste'/>
<img src="nfts/Kamari.png" title='Abrupt_Paste'/>
<img src="nfts/Kareem.png" title='Abrupt_Paste'/>
<img src="nfts/Kash.png" title='Abrupt_Paste'/>
<img src="nfts/Kashton.png" title='Abrupt_Paste'/>
<img src="nfts/Kayson.png" title='Abrupt_Paste'/>
<img src="nfts/Khaleesi.png" title='Abrupt_Paste'/>
<img src="nfts/Killian.png" title='Abrupt_Paste'/>
<img src="nfts/Kolton.png" title='Abrupt_Paste'/>
<img src="nfts/Kora.png" title='Abrupt_Paste'/>
<img src="nfts/Lainey.png" title='Abrupt_Paste'/>
<img src="nfts/Laurel.png" title='Abrupt_Paste'/>
<img src="nfts/Layton.png" title='Abrupt_Paste'/>
<img src="nfts/Leandro.png" title='Abrupt_Paste'/>
<img src="nfts/Leonard.png" title='Abrupt_Paste'/>
<img src="nfts/Lexie.png" title='Abrupt_Paste'/>
<img src="nfts/Liana.png" title='Abrupt_Paste'/>
<img src="nfts/Liliana.png" title='Abrupt_Paste'/>
<img src="nfts/Linda.png" title='Abrupt_Paste'/>
<img src="nfts/Liv.png" title='Abrupt_Paste'/>
<img src="nfts/Lucca.png" title='Abrupt_Paste'/>
<img src="nfts/Luciana.png" title='Abrupt_Paste'/>
<img src="nfts/Madisyn.png" title='Abrupt_Paste'/>
<img src="nfts/Makenna.png" title='Abrupt_Paste'/>
<img src="nfts/Malaya.png" title='Abrupt_Paste'/>
<img src="nfts/Marcos.png" title='Abrupt_Paste'/>
<img src="nfts/Marianna.png" title='Abrupt_Paste'/>
<img src="nfts/Marleigh.png" title='Abrupt_Paste'/>
<img src="nfts/Mateo.png" title='Abrupt_Paste'/>
<img src="nfts/Maxwell.png" title='Abrupt_Paste'/>
<img src="nfts/Mckinley.png" title='Abrupt_Paste'/>
<img src="nfts/Melissa.png" title='Abrupt_Paste'/>
<img src="nfts/Meredith.png" title='Abrupt_Paste'/>
<img src="nfts/Michael.png" title='Abrupt_Paste'/>
<img src="nfts/Milana.png" title='Abrupt_Paste'/>
<img src="nfts/Mohammad.png" title='Abrupt_Paste'/>
<img src="nfts/Molly.png" title='Abrupt_Paste'/>
<img src="nfts/Myles.png" title='Abrupt_Paste'/>
<img src="nfts/Nathanael.png" title='Abrupt_Paste'/>
<img src="nfts/Nellie.png" title='Abrupt_Paste'/>
<img src="nfts/Nicholas.png" title='Abrupt_Paste'/>
<img src="nfts/Niko.png" title='Abrupt_Paste'/>
<img src="nfts/Oaklyn.png" title='Abrupt_Paste'/>
<img src="nfts/Oaklynn.png" title='Abrupt_Paste'/>
<img src="nfts/Paisley.png" title='Abrupt_Paste'/>
<img src="nfts/Parker.png" title='Abrupt_Paste'/>
<img src="nfts/Paul.png" title='Abrupt_Paste'/>
<img src="nfts/Penelope.png" title='Abrupt_Paste'/>
<img src="nfts/Peter.png" title='Abrupt_Paste'/>
<img src="nfts/Presley.png" title='Abrupt_Paste'/>
<img src="nfts/Quinn.png" title='Abrupt_Paste'/>
<img src="nfts/Quinton.png" title='Abrupt_Paste'/>
<img src="nfts/Raven.png" title='Abrupt_Paste'/>
<img src="nfts/Rhea.png" title='Abrupt_Paste'/>
<img src="nfts/Rhett.png" title='Abrupt_Paste'/>
<img src="nfts/Rhys.png" title='Abrupt_Paste'/>
<img src="nfts/Rosemary.png" title='Abrupt_Paste'/>
<img src="nfts/Royal.png" title='Abrupt_Paste'/>
<img src="nfts/Ryan.png" title='Abrupt_Paste'/>
<img src="nfts/Ryann.png" title='Abrupt_Paste'/>
<img src="nfts/Saoirse.png" title='Abrupt_Paste'/>
<img src="nfts/Sincere.png" title='Abrupt_Paste'/>
<img src="nfts/Skye.png" title='Abrupt_Paste'/>
<img src="nfts/Solomon.png" title='Abrupt_Paste'/>
<img src="nfts/Steven.png" title='Abrupt_Paste'/>
<img src="nfts/Talon.png" title='Abrupt_Paste'/>
<img src="nfts/Taylor.png" title='Abrupt_Paste'/>
<img src="nfts/Tessa.png" title='Abrupt_Paste'/>
<img src="nfts/Theo.png" title='Abrupt_Paste'/>
<img src="nfts/Tomas.png" title='Abrupt_Paste'/>
<img src="nfts/Ty.png" title='Abrupt_Paste'/>
<img src="nfts/Tyler.png" title='Abrupt_Paste'/>
<img src="nfts/Van.png" title='Abrupt_Paste'/>
<img src="nfts/Walter.png" title='Abrupt_Paste'/>
<img src="nfts/Watson.png" title='Abrupt_Paste'/>
<img src="nfts/Westin.png" title='Abrupt_Paste'/>
<img src="nfts/Ximena.png" title='Abrupt_Paste'/>
<img src="nfts/Yousef.png" title='Abrupt_Paste'/>
<img src="nfts/Zainab.png" title='Abrupt_Paste'/>
<img src="nfts/Zelda.png" title='Abrupt_Paste'/>
<img src="nfts/Zola.png" title='Abrupt_Paste'/>
 </div>}



            <footer class="colorme" style={{padding:64}}>
               <h4 style={{padding:5}}>FAQ</h4>
            <br/>
            <br/>
            <ul id="faq">
              <li>
                 <p>
                 <strong>
                 🙋‍♂️  Why are there 179 MarsShotBots available?
                 </strong>
                 <br/>
                 Because I found 179 placeholder MoonshotBot assets on IPFS by sleuthing!
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♀️ When was this project launched?
                 </strong>
                 <br/>
                 Sep 17th, 2021, because I needed to ride some coat-tails
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️ Why was this project launched?
                 </strong>
                 <br/>
                 See above, also, I wanted to learn some things.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♀️ What are all the cool kids doing?
                 </strong>
                 <br/>
                 You are welcome to purchase 2 MarsShotBotss.  Keep one for yourself, and send another to your favorite Builder.    
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
                 These PFPs are minted on a bonding curve that increases ~9% (cause ~half the supply of MSB) each purchase, and starts with a price of 0.0033 ETH.  Here new curvbe!:
                 <br/>
                 <a href="https://docs.google.com/spreadsheets/d/e/2PACX-1vTI29iQh565K6GykQDplsmYM9-84LB7L2dumXBe_7oaoF8lfb3L-4wgzNyur7wRKFhQBPFHLWK5S30z/pubchart?oid=202580104&format=image">
                  <img src="https://docs.google.com/spreadsheets/d/e/2PACX-1vTI29iQh565K6GykQDplsmYM9-84LB7L2dumXBe_7oaoF8lfb3L-4wgzNyur7wRKFhQBPFHLWK5S30z/pubchart?oid=202580104&format=image" class="chart"/>
                  </a>

                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♀️Where does the ETH go when I purchase a MarsShotBots?
                 </strong>
                 <br/>
                80% of funds will go to the <a href="https://etherscan.io/address/0xde21F729137C5Af1b01d73aF1dC21eFfa2B8a0d6">Gitcoin Grants Multisig</a> to fund public goods on Gitcoin. 20% is going to simpl, who rescued these bots.
                 </p>
              </li>
              <li>
                 <p>
                 <strong>
                 🙋‍♂️Which MarsShotBots are the rarest?
                 </strong>
                 <br/>
                 1. I don't know!
                 <br/>
                 2. I don't know!
                 <br/>
                 3. I don't know!
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
                 Tweet at me; <a href="https://twitter.com/simpl192">@simpl192</a> I have no association with MoonshotCollective, ScaffETH, Austin, etc. However, I do appreciate their work and have learned much through their tools!
                 </p>
              </li>


            </ul>
            <br/>

              <a style={{padding:8}} href="https://github.com/austintgriffith/scaffold-eth/tree/moonshot-bots-with-curve">ScaffEth repo that I sleuthed.</a>
               |
              <a style={{padding:8}} href="broken">On OpenSea sometime soon?</a>
              |
              <a style={{padding:8}} href="https://etherscan.io/address/0x87EB118B004579fd82ddEd7F8e9d261A03172Ef1#writeContract">EtherScan</a>
              |

              <a style={{padding:8}} href="https://t.me/joinchat/v6N_GHY-8kU3ZmRh">Telegram</a>
              |
              <a style={{padding:8}} href="https://discord.gg/ACKb28pSSP">Discord</a>
              |
              <a style={{padding:8}} href="https://moonshotcollective.space">Moonshot Collective is not associated with my stupid antics, but here's their site</a>
              |
              Art by <a style={{padding:8}} href="https://Gitcoin.co/theCydonian">@theCydonian</a>/<a style={{padding:8}} href="https://Gitcoin.co/nasehim7">@nasehim7</a>
                       
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
