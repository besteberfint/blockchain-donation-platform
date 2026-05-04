// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Charity {
    // --- Events ---
    event Donated(address indexed donor, uint256 amount);
    event RequestCreated(uint256 indexed requestId, string description, address indexed vendor, uint256 amount);
    event Voted(uint256 indexed requestId, address indexed voter);
    event RequestFinalized(uint256 indexed requestId, address indexed vendor, uint256 amount);

    // --- State ---
    struct Request {
        string description;
        address payable vendor;
        uint256 amount;
        uint256 votes;
        bool completed;
    }

    address public manager;
    mapping(address => uint256) public donations;
    // requestId => voter => oy kullandı mı? (double voting koruması)
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    Request[] public requests;
    uint256 public totalDonors;
    bool private locked; // reentrancy kilidi

    // --- Modifier'lar ---
    modifier onlyManager() {
        require(msg.sender == manager, "Sadece yonetici bu islemi yapabilir");
        _;
    }

    // transfer() yerine call{} kullandığımız için reentrancy riski var; kilitleme ile önlüyoruz
    modifier nonReentrant() {
        require(!locked, "Reentrant cagri engellendi");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        manager = msg.sender;
    }

    // --- Bağış ---
    function donate() public payable {
        require(msg.value > 0, "Bagis miktari 0'dan buyuk olmali");
        if (donations[msg.sender] == 0) totalDonors++;
        donations[msg.sender] += msg.value;
        emit Donated(msg.sender, msg.value);
    }

    // --- Harcama Talebi ---
    function createRequest(
        string memory _desc,
        address payable _vendor,
        uint256 _amount
    ) public onlyManager {
        require(_vendor != address(0), "Gecersiz satici adresi");
        require(_amount > 0, "Miktar 0'dan buyuk olmali");
        require(_amount <= address(this).balance, "Yetersiz kontrat bakiyesi");

        uint256 requestId = requests.length;
        requests.push(Request({
            description: _desc,
            vendor: _vendor,
            amount: _amount,
            votes: 0,
            completed: false
        }));

        emit RequestCreated(requestId, _desc, _vendor, _amount);
    }

    // --- Oylama ---
    function voteRequest(uint256 _index) public {
        require(donations[msg.sender] > 0, "Sadece bagiscilar oy verebilir");
        require(_index < requests.length, "Gecersiz talep ID");
        require(!hasVoted[_index][msg.sender], "Bu talebe zaten oy verdiniz");
        require(!requests[_index].completed, "Talep zaten tamamlandi");

        hasVoted[_index][msg.sender] = true;
        requests[_index].votes++;

        emit Voted(_index, msg.sender);
    }

    // --- Ödeme ---
    function finalizeRequest(uint256 _index) public onlyManager nonReentrant {
        require(_index < requests.length, "Gecersiz talep ID");
        Request storage req = requests[_index];
        require(!req.completed, "Bu odeme zaten yapildi");
        require(req.votes > totalDonors / 2, "Bagiscilarin yarisindan fazlasi onaylamali");
        require(address(this).balance >= req.amount, "Yetersiz kontrat bakiyesi");

        req.completed = true;
        // transfer() yerine call{} kullanıyoruz: gas limiti yok, başarı kontrolü var
        (bool success, ) = req.vendor.call{value: req.amount}("");
        require(success, "Transfer basarisiz");

        emit RequestFinalized(_index, req.vendor, req.amount);
    }

    // --- Getter Yardımcıları ---
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getRequestsCount() public view returns (uint256) {
        return requests.length;
    }

    // Struct'ı tuple olarak döner; testlerde destructure edilebilir
    function getRequest(uint256 _index) public view returns (
        string memory description,
        address vendor,
        uint256 amount,
        uint256 votes,
        bool completed
    ) {
        require(_index < requests.length, "Gecersiz talep ID");
        Request storage req = requests[_index];
        return (req.description, req.vendor, req.amount, req.votes, req.completed);
    }
}
