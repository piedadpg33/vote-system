// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VotingResults {
    struct Result {
        uint256 yes;
        uint256 no;
        uint256 abstain;
        bool exists;
    }

    mapping(uint256 => Result) public results;

    // Direcciones de presidentes predefinidas (cambia por las reales)
    address constant PRESIDENT1 = 0xEee94D8bB49a503540390db92D9cd217FD74d7cE;
    address constant PRESIDENT2 = 0x6c4d5f88E7F739491BE35056bA8539f7625e6De6;

    event VoteClosed(uint256 indexed voteId, uint256 yes, uint256 no, uint256 abstain);


    modifier onlyPresident() {
        require(msg.sender == PRESIDENT1 || msg.sender == PRESIDENT2, "Only parliament president can call this");
        _;
    }

    function saveResult(uint256 voteId, uint256 yes, uint256 no, uint256 abstain) external onlyPresident {
        require(!results[voteId].exists, "Result already saved");
        results[voteId] = Result(yes, no, abstain, true);
        emit VoteClosed(voteId, yes, no, abstain);
    }

    function getResult(uint256 voteId) external view returns (uint256, uint256, uint256) {
        require(results[voteId].exists, "No result");
        Result memory r = results[voteId];
        return (r.yes, r.no, r.abstain);
    }
}
