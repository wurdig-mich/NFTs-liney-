//give contract some svg code
//outut an nft uri with this svg code
//storing all the nft metadata on-chain
// SPDX-License-Identifier: MIT
pragma solidity 0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "base64-sol/base64.sol";

contract SVGNFT is ERC721URIStorage {
    uint256 public tokenCounter;

    constructor() ERC721("SVG NFT", "svgNFT") {
        tokenCounter = 0;
    }

    function create(string memory _svg) public {
        _safeMint(msg.sender, tokenCounter);
        //tokenURI
        string memory imageURI = svgToImageURI(_svg);

        //imageURI
        string memory tokenURI = formatTokenURI(imageURI);

        _setTokenURI(tokenCounter, tokenURI);
        tokenCounter += 1;
    }

    function svgToImageURI(string memory _svg)
        public
        pure
        returns (string memory)
    {
        //data:image/svg+xml;base64,<Base64-encoding>
        string memory baseURL = "data:image/svg+xml;base64,";
        string memory svgBase64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(_svg)))
        );
        string memory imageURI = string(
            abi.encodePacked(baseURL, svgBase64Encoded)
        );
        return imageURI;
    }

    function formatTokenURI(string memory imageURI)
        public
        pure
        returns (string memory)
    {
        string memory baseURL = "data:application/json;base64,";
        return
            string(
                abi.encodePacked(
                    baseURL,
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"SVG NFT",',
                                '"description": "An NFT based on SVG!",',
                                '"attributes": "",',
                                '"image": "',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }
}
