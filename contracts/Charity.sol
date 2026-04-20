// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Charity {
    struct Request {
        string description;     // Paranın neden istendiği
        address payable vendor; // Paranın ödeneceği kurum/kişi
        uint256 amount;         // İstenen miktar
        uint256 votes;          // Onay veren bağışçı sayısı
        bool completed;         // Ödeme tamamlandı mı?
    }

    address public manager;
    mapping(address => uint256) public donations;
    Request[] public requests;
    uint256 public totalDonors;

    constructor() {
        manager = msg.sender; // Kontratı yükleyen kişi yönetici olur
    }

    // Bağış yapma fonksiyonu
    function donate() public payable {
        require(msg.value > 0, "Bagis miktari 0'dan buyuk olmali");
        if(donations[msg.sender] == 0) totalDonors++;
        donations[msg.sender] += msg.value;
    }

    // Harcama talebi oluşturma (Sadece yönetici)
    function createRequest(string memory _desc, address payable _vendor, uint256 _amount) public {
        require(msg.sender == manager, "Sadece yonetici talep olusturabilir");
        requests.push(Request({
            description: _desc,
            vendor: _vendor,
            amount: _amount,
            votes: 0,
            completed: false
        }));
    }

    // Bağışçıların harcamayı onaylaması
    function voteRequest(uint256 _index) public {
        require(donations[msg.sender] > 0, "Sadece bagiscilar oy verebilir");
        requests[_index].votes++;
    }

    // Parayı satıcıya gönder (Yeterli oy varsa)
    function finalizeRequest(uint256 _index) public {
        Request storage request = requests[_index];
        require(request.votes > (totalDonors / 2), "Bagiscilarin yarisindan fazlasi onaylamali");
        require(!request.completed, "Bu odeme zaten yapildi");
        
        request.completed = true;
        request.vendor.transfer(request.amount);
    }
}