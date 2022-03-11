/* Moralis init code */
const serverUrl = "https://c5wtjzrjd6ik.usemoralis.com:2053/server";
const appId = "F099tKUgrqi6DfKsoKVsWOoohivBRXvpIBfvy7BY";
Moralis.start({ serverUrl, appId });

/* Moralis Authentication code */

if (Moralis.User.current() == null && window.location.href != "http://127.0.0.1:5500/index.html") {
	window.location.href = "index.html";
}

login = async () => {
	await Moralis.authenticate()
		.then(async (user) => {
			user.set("name", document.getElementById("user-username").value);
			user.set("email", document.getElementById("user-useremail").value);
			await user.save();
			window.location.href = "dashboard.html";
			getTransactions();
		})
		.catch((err) => {
			console.log("Error occured: ", err);
		});
};

logout = async () => {
	await Moralis.User.logOut()
		.then(() => {
			console.log("logged out");
		})
		.catch((err) => {
			console.log("Error occured while logging out ", err);
		});
	console.log("logout pressed");
	window.location.href = "index.html";
};

// Functions

getTransactions = async () => {
	const options = { chain: "ropsten", address: `${Moralis.User.current().get("ethAddress")}`, order: "desc", from_block: "0" };
	const transactions = await Moralis.Web3API.account.getTransactions(options);
	//clear the intial table
	if (document.getElementById("transactions-table-body")) {
		document.getElementById("transactions-table-body").innerHTML = "";
	}
	if (transactions.total > 0) {
		//populate the table
		transactions.result.forEach((row) => {
			let content = `
				<tr>
					<td><a href='https://ropsten.etherscan.io/tx/${row.hash}' target='_blank' rel='noopener noreferrer'>${row.hash}</a></td>
					<td><a href='https://ropsten.etherscan.io/block/${row.block_number}' target='_blank' rel='noopener noreferrer'>${row.block_number}</a></td>
					<td>${millisecondsToTime(row.block_timestamp)}</td>
					<td>${getType(row.from_address)}</td>
					<td>${((row.gas * row.gas_price) / 1e18).toFixed(5)} Eth</td>
					<td>${(row.value / 1e18).toFixed(5)} Eth</td>
				</tr>
			`;

			document.getElementById("transactions-table-body").innerHTML += content;
		});
	}
};

getBalances = async () => {
	//clear the intial table
	if (document.getElementById("balances-table-body")) {
		document.getElementById("balances-table-body").innerHTML = "";
	}

	const eth_balance = await Moralis.Web3API.account.getNativeBalance();

	const ropsten_options = { chain: "ropsten", address: `${Moralis.User.current().get("ethAddress")}` };
	const ropsten_balance = await Moralis.Web3API.account.getNativeBalance(ropsten_options);

	const rinkeby_options = { chain: "rinkeby", address: `${Moralis.User.current().get("ethAddress")}` };
	const rinkeby_balance = await Moralis.Web3API.account.getNativeBalance(rinkeby_options);

	let content = `
				<tr>
					<td><a href='https://etherscan.io/address/${Moralis.User.current().get("ethAddress")}' target='_blank' rel='noopener noreferrer'>Ethereum</a></td>
					<td>${(eth_balance.balance / 1e18).toFixed(5)}</td>
				</tr>
				<tr>
					<td><a href='https://ropsten.etherscan.io/address/${Moralis.User.current().get("ethAddress")}' target='_blank' rel='noopener noreferrer'>Ropsten</a></td>
					<td>${(ropsten_balance.balance / 1e18).toFixed(5)}</td>
				</tr>
				<tr>
					<td><a href='https://rinkeby.etherscan.io/address/${Moralis.User.current().get("ethAddress")}' target='_blank' rel='noopener noreferrer'>Rinkeby</a></td>
					<td>${(rinkeby_balance.balance / 1e18).toFixed(5)}</td>
				</tr>
			`;

	document.getElementById("balances-table-body").innerHTML += content;
};

getNfts = async () => {
	if (document.getElementById("nft-card")) {
		document.getElementById("nft-card").innerHTML = "";
	}

	const options = { chain: "ropsten", address: Moralis.User.current().get("ethAddress") };
	const ropsten_nfts = await Moralis.Web3API.account.getNFTs(options);

	if (ropsten_nfts.result.length == 0) {
		document.getElementById("nft-div").innerHTML = `<h5>No NFTs available</h5>`;
	}

	if (ropsten_nfts.result.length > 0) {
		ropsten_nfts.result.forEach((nft) => {
			let metadata = JSON.parse(nft.metadata);
			console.log(metadata);
			const metadata_image_url = metadata.image.split("ipfs://").slice(-1);
			// console.log("https://ipfs.io/ipfs/${metadata_image_url}");
			let content = `
				<div class="card col-md-3">
					<img src='https://ipfs.io/ipfs/${metadata_image_url}' class="card-img-top">
					<div class="card-body">
			  			<h5 class="card-title">${metadata.name}</h5>
			  			<p class="card-text">${metadata.description}</p>
			  			<p class="card-text">Current Owner: ${nft.owner_of}</p>
			 			<a href="https://ropsten.etherscan.io/address/${nft.token_address}" class="btn btn-primary" target='_blank' rel='noopener noreferrer'>View on Etherscan</a>
					</div>
			    </div>
			`;

			document.getElementById("nft-card").innerHTML += content;
		});
	}
};

getType = (from_address) => {
	// console.log(Moralis.User.current().get("ethAddress")); gives current logged in address

	if (from_address == Moralis.User.current().get("ethAddress")) {
		return "outgoing";
	} else {
		return "incoming";
	}
};

millisecondsToTime = (block_timestamp) => {
	// console.log(Date.parse(block_timestamp)); converts human readble time format to milliseconds since 1970
	// console.log(new Date().getTime()); gives current time in milliseconds since 1970
	let ms = new Date().getTime() - Date.parse(block_timestamp);
	let seconds = ms / 1000;
	let minutes = ms / (60 * 1000);
	let hours = ms / (60 * 60 * 1000);
	let days = ms / (60 * 60 * 24 * 1000);
	if (days < 1) {
		if (hours < 1) {
			if (minutes < 1) {
				return `${seconds.toFixed(0)} seconds(s) ago`;
			} else {
				return `${minutes.toFixed(0)} minutes(s) ago`;
			}
		} else {
			return `${hours.toFixed(0)} hour(s) ago`;
		}
	} else {
		return `${days.toFixed(0)} day(s) ago`;
	}
};

if (document.getElementById("signin-btn") != null) {
	document.getElementById("signin-btn").onclick = login;
}
if (document.getElementById("signout-btn") != null) {
	document.getElementById("signout-btn").onclick = logout;
}
if (document.getElementById("get-transactions") != null) {
	document.getElementById("get-transactions").onclick = getTransactions;
}
if (document.getElementById("get-balances") != null) {
	document.getElementById("get-balances").onclick = getBalances;
}
if (document.getElementById("get-nfts") != null) {
	document.getElementById("get-nfts").onclick = getNfts;
}

if (window.location.href == "http://127.0.0.1:5500/dashboard.html") {
	getTransactions();
	getBalances();
	getNfts();
}
