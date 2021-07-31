<script>
    const initalText = 'Connect Wallet';
    let buttonText = initalText;
    async function requestAccount() {
        if(typeof window.ethereum !== 'undefined') {
            await window.ethereum.request({method: 'eth_requestAccounts'});
            const [account] = await window.ethereum.request({method: 'eth_requestAccounts'})
            const length = 6;
            let accountString = account.toString();
            let firstPart = accountString.substring(0, length);
            let midPart = " .... ";
            let lastPart = accountString.substr(-6);
            accountString = firstPart.concat(midPart.concat(lastPart));
            buttonText = accountString;
        } else {
            buttonText = initalText;
        }
    }
</script>

<nav class = "flex items-center justify-between flex-wrap bg-gray-900 p-6">
    <div class = "flex items-center flex-shrink-0 text-green-100 mr-10">
        <span class = "font-bold text-xl">Saxenism Swap</span>
    </div>

    <div class = "w-full block flex-grow sm:flex sm:items-center sm:w-auto">
        <div class = "text-sm sm:flex-grow">
            <a href = "/"
               class = "block mt-4 sm:inline-block sm:mt-0 text-green-300 hover:text-white mr-4">
               Home
            </a>
            <a href = "/liquidity"
               class = "block mt-4 sm:inline-block sm:mt-0 text-green-300 hover:text-white mr-4">
               Provide Liquidity
            </a>
            <a href = "/swap"
               class = "block mt-4 sm:inline-block sm:mt-0 text-green-300 hover:text-white mr-4">
               Swap Assets
            </a>
        </div>
        <div>
            <a
              href=""
              class="inline-block text-sm px-4 py-2 leading-none border rounded text-green-300 border-green-100 hover:border-transparent hover:text-white hover:bg-green-300 mt-4 md:mt-0"
              on:click={requestAccount}
              >
              {buttonText}
            </a>
          </div>
    </div>
</nav>

