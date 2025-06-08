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

    event VoteClosed(uint256 indexed voteId, uint256 yes, uint256 no, uint256 abstain);

    function saveResult(uint256 voteId, uint256 yes, uint256 no, uint256 abstain) external {
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
