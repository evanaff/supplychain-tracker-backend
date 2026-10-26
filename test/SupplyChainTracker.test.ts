import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import type { SupplyChainTracker } from "../typechain-types";

describe("SupplyChainTracker", function () {
    const PRODUCT_EVENT_ID = "PE-000001";
    const PRODUCT_LOT_ID = "PL-000001";

    const DATA_HASH = ethers.keccak256(
        ethers.toUtf8Bytes("Product Event Data"),
    );

    async function deployFixture() {
        const [owner, actor, outsider] = await ethers.getSigners();

        const factory = await ethers.getContractFactory(
            "SupplyChainTracker",
            owner,
        );

        const tracker = (await factory.deploy()) as SupplyChainTracker;

        await tracker.waitForDeployment();

        return { tracker, owner, actor, outsider };
    }

    async function registeredActorFixture() {
        const context = await deployFixture();

        await (
            await context.tracker.addActor(context.actor.address)
        ).wait();

        return context;
    }

    describe("Deployment", function () {
        it("Set the deployer as the owner", async function () {
            const { tracker, owner } = await loadFixture(deployFixture);

            expect(await tracker.owner()).to.equal(owner.address);
        });
    });

    describe("Add Actor", function () {
        it("Allows the owner to register a new actor", async function () {
            const { tracker, actor } = await loadFixture(deployFixture);

            expect(await tracker.actors(actor.address)).to.equal(false);

            await (await tracker.addActor(actor.address)).wait();

            expect(await tracker.actors(actor.address)).to.equal(true);
        });

        it("Reject non-owner to register new actor", async function () {
            const { tracker, actor, outsider } = await loadFixture(deployFixture);

            await expect(
                tracker.connect(outsider).addActor(actor.address),
            ).to.be.revertedWith("Unauthorized admin access");

            expect(await tracker.actors(actor.address)).to.equal(false);
        });

        it("Reject zero address when registering a new actor", async function () {
            const { tracker } = await loadFixture(deployFixture);

            const zeroAddress = ethers.ZeroAddress;

            await expect(
                tracker.addActor(zeroAddress),
            ).to.be.revertedWith("Invalid actor address");

            expect(await tracker.actors(zeroAddress)).to.equal(false);
        });

        it("Reject duplication of registered actor", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            await expect(
                tracker.addActor(actor.address),
            ).to.be.revertedWith("actor is already registered");

            expect(await tracker.actors(actor.address)).to.equal(true);
        });
    });

    describe("Remove Actor", function () {
        it("Allows the owner to remove registered actors", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            await (await tracker.removeActor(actor.address)).wait();

            expect(await tracker.actors(actor.address)).to.equal(false);
        });

        it("Reject non owner to remove registered actor", async function () {
            const { tracker, actor, outsider } = await loadFixture(registeredActorFixture);

            await expect(
                tracker.connect(outsider).removeActor(actor.address),
            ).to.be.revertedWith("Unauthorized admin access");

            expect(await tracker.actors(actor.address)).to.equal(true);
        });
    });

    describe("Add Product Event", function () {
        it("Allow registered actor to add product event", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            await (
                await tracker.connect(actor).addProductEvent(PRODUCT_EVENT_ID, PRODUCT_LOT_ID, DATA_HASH)
            ).wait();

            const event = await tracker.productEvents(PRODUCT_EVENT_ID);

            expect(event.productEventId).to.equal(PRODUCT_EVENT_ID);
            expect(event.dataHash).to.equal(DATA_HASH);

            expect(
                await tracker.getProductEventIdsByProductLotId(PRODUCT_LOT_ID),
            ).to.deep.equal([PRODUCT_EVENT_ID]);
        });

        it("Reject unregistered account to add product event", async function () {
            const { tracker, outsider } = await loadFixture(deployFixture);

            await expect(
                tracker.connect(outsider).addProductEvent(PRODUCT_EVENT_ID, PRODUCT_LOT_ID, DATA_HASH),
            ).to.be.revertedWith("Unauthorized actor access");

            const event = await tracker.productEvents(PRODUCT_EVENT_ID);

            expect(event.productEventId).to.equal("");
            expect(event.dataHash).to.equal(ethers.ZeroHash);

            expect(
                await tracker.getProductEventIdsByProductLotId(PRODUCT_LOT_ID),
            ).to.deep.equal([]);
        });

        it("Reject empty product event ID", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            await expect(
                tracker.connect(actor).addProductEvent("", PRODUCT_LOT_ID, DATA_HASH),
            ).to.be.revertedWith("Product event ID cannot be empty");

            const event = await tracker.productEvents("");

            expect(event.productEventId).to.equal("");
            expect(event.dataHash).to.equal(ethers.ZeroHash);

            expect(
                await tracker.getProductEventIdsByProductLotId(PRODUCT_LOT_ID),
            ).to.deep.equal([]);
        });

        it("Reject empty product lot ID", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            await expect(
                tracker.connect(actor).addProductEvent(PRODUCT_EVENT_ID, "", DATA_HASH),
            ).to.be.revertedWith("Product lot ID cannot be empty");

            const event = await tracker.productEvents(PRODUCT_EVENT_ID);

            expect(event.productEventId).to.equal("");
            expect(event.dataHash).to.equal(ethers.ZeroHash);

            expect(
                await tracker.getProductEventIdsByProductLotId(""),
            ).to.deep.equal([]);
        });

        it("Reject zero data hash", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            await expect(
                tracker.connect(actor).addProductEvent(PRODUCT_EVENT_ID, PRODUCT_LOT_ID, ethers.ZeroHash),
            ).to.be.revertedWith("Data hash cannot be empty");

            const event = await tracker.productEvents(PRODUCT_EVENT_ID);

            expect(event.productEventId).to.equal("");
            expect(event.dataHash).to.equal(ethers.ZeroHash);

            expect(
                await tracker.getProductEventIdsByProductLotId(PRODUCT_LOT_ID),
            ).to.deep.equal([]);
        });

        it("Reject duplication of product event ID", async function () {
            const { tracker, actor } = await loadFixture(registeredActorFixture);

            const otherProductLotId = "PL-000002";
            const otherHash = ethers.keccak256(
                ethers.toUtf8Bytes("different product event data"),
            );

            await (
                await tracker.connect(actor).addProductEvent(PRODUCT_EVENT_ID, PRODUCT_LOT_ID, DATA_HASH)
            ).wait();

            await expect(
                tracker.connect(actor).addProductEvent(PRODUCT_EVENT_ID, otherProductLotId, otherHash),
            ).to.be.revertedWith("Product event already exists");

            const event = await tracker.productEvents(PRODUCT_EVENT_ID);

            expect(event.productEventId).to.equal(PRODUCT_EVENT_ID);
            expect(event.dataHash).to.equal(DATA_HASH);

            expect(
                await tracker.getProductEventIdsByProductLotId(PRODUCT_LOT_ID),
            ).to.deep.equal([PRODUCT_EVENT_ID]);

            expect(
                await tracker.getProductEventIdsByProductLotId(otherProductLotId),
            ).to.deep.equal([]);
        });
    });

    describe("Get Product Event IDs by Product Lot ID", function () {
        it("Get all product event IDs according to product lot ID", async function () {
            const { tracker, actor, outsider } = await loadFixture(registeredActorFixture);

            const secondEventId = "PE-000002";
            const thirdEventId = "PE-000003";

            await (
                await tracker.connect(actor).addProductEvent(PRODUCT_EVENT_ID, PRODUCT_LOT_ID, DATA_HASH)
            ).wait();

            await (
                await tracker.connect(actor).addProductEvent(secondEventId, PRODUCT_LOT_ID, DATA_HASH)
            ).wait();

            await (
                await tracker.connect(actor).addProductEvent(thirdEventId, PRODUCT_LOT_ID, DATA_HASH)
            ).wait();

            expect(
                await tracker.connect(outsider).getProductEventIdsByProductLotId(PRODUCT_LOT_ID),
            ).to.deep.equal([PRODUCT_EVENT_ID, secondEventId, thirdEventId]);
        });
    });
});