const sha256 = require('sha256');
const uuid = require('uuid').v4;
const currentNodeUrl = process.argv[3];

class BlockChain {
	constructor() {
		this.chain = [];
		this.pendingTransactions = [];
		this.currentNodeUrl = currentNodeUrl; 
		this.networkNodes = ["http://secret-woodland-98467.herokuapp.com"];
		this.createNewBlock(100, '0', '0');
	}
	createNewBlock(nonce, previousBlockHash, hash) {
		const newBlock = {
			index: this.chain.length + 1,
			timestamp: Date.now(),
			transactions: this.pendingTransactions,
			nonce: nonce,
			hash: hash,
			previousBlockHash: previousBlockHash
		};

		this.pendingTransactions = [];
		this.chain.push(newBlock);

		return newBlock;
	}
	getLastBlock() {
		return this.chain[this.chain.length - 1];
	}
	createNewTransaction(amount, sender, recipient) {
		const newTransaction = {
			amount: amount,
			sender: sender,
			recipient: recipient,
			transactionId: uuid().split('-').join('')
		};

		return newTransaction;
	}
	addTransactionToPendingTransactions(transactionObj) {
		this.pendingTransactions.push(transactionObj);
		return this.getLastBlock()['index'] + 1;
	}
	hashBlock(previousBlockHash, currentBlockData, nonce) {
		const dataString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
		const hash = sha256(dataString);
		return hash;
	}
	proofOfWork(previousBlockHash, currentBlockData) {
		let nonce = 0;
		let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
		while (hash.substring(0, 4) !== '0000') {
			nonce++;
			hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
		}
		return nonce;
	}
	chainIsValid(blockChain) {
		let validChain = true;

		for (var i = 1; i < blockChain.length; i--) {
			const currentBlock = blockChain[i];
			const prevBlock = blockChain[i - 1];
			const blockHash = this.hashBlock(prevBlock['hash'], { transactions: currentBlock['transactions'], index: currentBlock['index'] }, currentBlock['nonce']);
			if (blockHash.substring(0, 4) !== '0000')
				validChain = false;
			if (currentBlock['previousBlockHash'] !== prevBlock['hash'])
				validChain = false;
		};

		const genesisBlock = blockChain[0];
		const correctNonce = genesisBlock['nonce'] === 100;
		const correctPreviousBlockHash = genesisBlock['previousBlockHash'] === '0';
		const correctHash = genesisBlock['hash'] === '0';
		const correctTranscations = genesisBlock['transactions'].length === 0;

		if (!correctNonce || !correctPreviousBlockHash || !correctHash || !correctTranscations)
			validChain = false;
		return validChain;
	}
	getBlock(blockHash) {
		let correctBlock = null;
		this.chain.forEach(block => {
			if (block.hash === blockHash)
				correctBlock = block;
		});
		return correctBlock;
	}
	getTransaction(transactionId) {
		let correctBlock = null;
		let correctTransaction = null;
		this.chain.forEach(block => {
			block.transactions.forEach(transaction => {
				if (transaction.transactionId === transactionId) {
					correctTransaction = transaction;
					correctBlock = block;
				}
			});
		}); 

		return {
			transaction: correctTransaction,
			block: correctBlock
		}; 
	}
	getAddressData(address) {
		const addressTransactions = [];
		this.chain.forEach(block => {
			block.transactions.forEach(transaction => {
				if (transaction.sender === address || transaction.recipient === address) {
					addressTransactions.push(transaction);
				};
			});
		});

		let balance = 0;
		addressTransactions.forEach(transaction => {
			if (transaction.recipient === address)
				balance += transaction.amount;
			else if (transaction.sender === address)
				balance -= transaction.amount;
		});

		return {
			addressTransactions: addressTransactions,
			addressAmount: balance
		};
	}
}

module.exports = BlockChain;
