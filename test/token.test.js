const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyToken (OpenZeppelin ERC20)", function () {
  let token, owner, alice, bob;
  const NAME = "TestToken";
  const SYMBOL = "TT";
  const INITIAL = ethers.parseUnits("1000", 18);

  beforeEach(async () => {
    [owner, alice, bob] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MyToken");
    token = await Factory.deploy(NAME, SYMBOL, INITIAL); // v6: no deployed()
  });

  it("deploys with correct metadata and initial supply to deployer", async () => {
    expect(await token.name()).to.equal(NAME);
    expect(await token.symbol()).to.equal(SYMBOL);
    expect(await token.decimals()).to.equal(18n);
    expect(await token.totalSupply()).to.equal(INITIAL);
    expect(await token.balanceOf(owner.address)).to.equal(INITIAL);
  });

  it("transfers tokens", async () => {
    await expect(token.transfer(alice.address, ethers.parseUnits("100", 18)))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, alice.address, ethers.parseUnits("100", 18));

    expect(await token.balanceOf(alice.address)).to.equal(
      ethers.parseUnits("100", 18)
    );
  });

  it("handles allowance & transferFrom correctly", async () => {
    await token.approve(alice.address, ethers.parseUnits("50", 18));
    expect(await token.allowance(owner.address, alice.address)).to.equal(
      ethers.parseUnits("50", 18)
    );

    await expect(
      token
        .connect(alice)
        .transferFrom(owner.address, bob.address, ethers.parseUnits("10", 18))
    ).to.emit(token, "Transfer");

    expect(await token.balanceOf(bob.address)).to.equal(
      ethers.parseUnits("10", 18)
    );
    expect(await token.allowance(owner.address, alice.address)).to.equal(
      ethers.parseUnits("40", 18)
    );
  });

  it("prevents overspend and zero-address transfers", async () => {
    await expect(token.transfer(alice.address, INITIAL + 1n)).to.be.reverted;
    await expect(token.transfer(ethers.ZeroAddress, 1n)).to.be.reverted;
  });

  it("owner can mint; non-owners cannot", async () => {
    await token.mint(alice.address, ethers.parseUnits("5", 18));
    expect(await token.balanceOf(alice.address)).to.equal(
      ethers.parseUnits("5", 18)
    );
    await expect(token.connect(alice).mint(alice.address, 1n)).to.be.reverted;
  });

  it("holder can burn their tokens", async () => {
    await token.transfer(alice.address, ethers.parseUnits("20", 18));
    await token.connect(alice).burn(ethers.parseUnits("5", 18));
    expect(await token.balanceOf(alice.address)).to.equal(
      ethers.parseUnits("15", 18)
    );
  });

  it("edge case: zero transfer allowed and emits event", async () => {
    await expect(token.transfer(alice.address, 0n))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, alice.address, 0n);
  });
});
