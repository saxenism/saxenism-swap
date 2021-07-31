<script>
    import {ethers} from 'ethers';
    import TokenA from "../artifacts/contracts/TokenA.sol/TokenA.json"
    import ExchangeBusinessLogic from "../artifacts/contracts/ExchangeBusinessLogic.sol/ExchangeBusinessLogic.json"

    const tokenAAddress = "0x96273AAc53dED55e0cE26E7dd4d834662F16351";
    const saxenismSwapAddress = "0x292ADe4ccC74D415B85Ef899B8fcC9ef";

    async function requestAccount() {
        await window.ethereum.request({method: 'eth_requestAccounts'});
    }

    async function getBalance() {
        if(typeof window.ethereum !== 'undefined') {
            const [account] = await window.ethereum.request({method: 'eth_requestAccounts'});
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(tokenAAddress, TokenA.abi, provider);
            const balance = await contract.balanceOf(account);
            console.log("Balance: ", balance);
            return balance;
        }
    }

    // async function netmdTotalSupply() {
    //     if(typeof window.ethereum !== 'undefined') {
    //         await window.ethereum.request({method: 'eth_requestAccounts'});
    //         const provider = new ethers.providers.Web3Provider(window.ethereum);
    //         const contract = new ethers.Contract(tokenAAddress, TokenA.abi, provider);
    //         const totalNetmdTokens = await contract.totalSupply();
    //         console.log("Total Supply: ", totalNetmdTokens);
    //     }        
    // }

    async function fetchTotalSupply() {
        if(typeof window.ethereum !== 'undefined') {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const contract = new ethers.Contract(tokenAAddress, TokenA.abi, provider);
            try {
                const data = await contract.totalSupply();
                console.log("Total Supply: ", data);
            } catch (err){
                console.log('Error: ', err);
            }
        }
    }

</script>

<body class="bg-gray-800">
	<main>
		<h4 class="text-3xl text-center my-8 text-green-300">Welcome to RunETH</h4>
		<br />
		<br />
		<h2 class="text-2xl text-center my-6 text-green-300">
			&#128151 Your on-chain fitness accountability service &#128151
		</h2>
		<h2 class="text-2xl text-center my-6 text-green-300">
			Fuel your motivation with the power of ethereum and achieve your fitness dreams at your pace!!
		</h2>
        <button on:click={fetchTotalSupply}>Click Me fucker!!</button>
	</main>
</body>