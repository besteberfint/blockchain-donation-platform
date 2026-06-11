// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Charity {
    // --- Events ---
    event Donated(address indexed donor, uint256 amount);
    event DonatedToCampaign(address indexed donor, uint256 indexed campaignId, uint256 amount);
    event RequestCreated(uint256 indexed requestId, string description, address indexed vendor, uint256 amount);
    event Voted(uint256 indexed requestId, address indexed voter);
    event RequestFinalized(uint256 indexed requestId, address indexed vendor, uint256 amount);
    event CampaignProposed(uint256 indexed proposalId, address indexed proposer, string title);
    event CampaignApproved(uint256 indexed proposalId);
    event CampaignRejected(uint256 indexed proposalId);

    // --- Structs ---
    struct Request {
        string description;
        address payable vendor;
        uint256 amount;
        uint256 votes;
        bool completed;
    }

    struct CampaignProposal {
        address proposer;
        string title;
        string description;
        string emoji;
        uint256 goalWei;
        bool approved;
        bool rejected;
    }

    // --- State ---
    address public manager;
    mapping(address => uint256) public donations;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => uint256) public campaignRaised;
    Request[] public requests;
    CampaignProposal[] public campaignProposals;
    uint256 public totalDonors;
    bool private locked;

    // --- Modifiers ---
    modifier onlyManager() {
        require(msg.sender == manager, "Sadece yonetici bu islemi yapabilir");
        _;
    }

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

    // --- Kampanyaya Özel Bağış ---
    function donateToCampaign(uint256 _campaignId) public payable {
        require(msg.value > 0, "Bagis miktari 0'dan buyuk olmali");
        require(_campaignId < campaignProposals.length, "Gecersiz kampanya ID");
        require(campaignProposals[_campaignId].approved, "Kampanya henuz onaylanmadi");

        if (donations[msg.sender] == 0) totalDonors++;
        donations[msg.sender] += msg.value;
        campaignRaised[_campaignId] += msg.value;

        emit DonatedToCampaign(msg.sender, _campaignId, msg.value);
        emit Donated(msg.sender, msg.value);
    }

    function getCampaignRaised(uint256 _campaignId) public view returns (uint256) {
        require(_campaignId < campaignProposals.length, "Gecersiz kampanya ID");
        return campaignRaised[_campaignId];
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
        (bool success, ) = req.vendor.call{value: req.amount}("");
        require(success, "Transfer basarisiz");

        emit RequestFinalized(_index, req.vendor, req.amount);
    }

    // --- Kampanya Teklifi ---
    function proposeCampaign(
        string calldata _title,
        string calldata _description,
        string calldata _emoji,
        uint256 _goalWei
    ) external {
        require(bytes(_title).length > 0, "Baslik bos olamaz");
        require(_goalWei > 0, "Hedef 0'dan buyuk olmali");

        uint256 proposalId = campaignProposals.length;
        campaignProposals.push(CampaignProposal({
            proposer: msg.sender,
            title: _title,
            description: _description,
            emoji: _emoji,
            goalWei: _goalWei,
            approved: false,
            rejected: false
        }));

        emit CampaignProposed(proposalId, msg.sender, _title);
    }

    function approveCampaign(uint256 _index) external onlyManager {
        require(_index < campaignProposals.length, "Gecersiz ID");
        require(!campaignProposals[_index].approved, "Zaten onaylandi");
        require(!campaignProposals[_index].rejected, "Zaten reddedildi");
        campaignProposals[_index].approved = true;
        emit CampaignApproved(_index);
    }

    function rejectCampaign(uint256 _index) external onlyManager {
        require(_index < campaignProposals.length, "Gecersiz ID");
        require(!campaignProposals[_index].approved, "Zaten onaylandi");
        require(!campaignProposals[_index].rejected, "Zaten reddedildi");
        campaignProposals[_index].rejected = true;
        emit CampaignRejected(_index);
    }

    function getCampaignProposalsCount() external view returns (uint256) {
        return campaignProposals.length;
    }

    function getCampaignProposal(uint256 _index) external view returns (
        address proposer,
        string memory title,
        string memory description,
        string memory emoji,
        uint256 goalWei,
        bool approved,
        bool rejected
    ) {
        require(_index < campaignProposals.length, "Gecersiz ID");
        CampaignProposal storage p = campaignProposals[_index];
        return (p.proposer, p.title, p.description, p.emoji, p.goalWei, p.approved, p.rejected);
    }

    // --- Getter Yardımcıları ---
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function getRequestsCount() public view returns (uint256) {
        return requests.length;
    }

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
