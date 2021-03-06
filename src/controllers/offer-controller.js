const { Op } = require("sequelize");
const { v4: UUIDV4 } = require("uuid");
const db = require("../models");
const HttpError = require("../utils/HttpError");

module.exports = {
  async list(req, res, next) {
    try {
      const { status } = req.query;

      let queryFilter = {};

      if (status) queryFilter = { status };

      const offers = await db.Offer.findAll({
        where: queryFilter,
        include: [
          {
            model: db.Owner,
            as: "Owner",
            attributes: {
              exclude: ["id", "createdAt", "updatedAt"],
            },
            include: ["User"],
          },
        ],
      });
      return res.status(200).json(offers);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 500,
          err.message
            ? err.message
            : "There was a problem querying the requested data."
        )
      );
    }
  },

  async listOwner(req, res) {
    const { user_id } = req;
    try {
      const offers = await db.Offer.findAll({
        include: [
          {
            model: db.Owner,
            as: "Owner",
            attributes: {
              exclude: ["id", "createdAt", "updatedAt"],
            },
            required: true,
            include: {
              model: db.User,
              as: "User",
              where: { id: user_id },
              required: true,
            },
          },
        ],
      });
      return res.status(200).json(offers);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 500,
          err.message
            ? err.message
            : "There was a problem querying the requested data."
        )
      );
    }
  },

  async get(req, res, next) {
    const { id } = req.params;
    try {
      const offer = await db.Offer.findOne({ where: { id } });

      if (!offer) next(new HttpError(404, "Not Found"));

      return res.status(200).json(offer);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 500,
          err.message
            ? err.message
            : "There was a problem querying the requested data."
        )
      );
    }
  },

  async owner(req, res) {
    const { id } = req.params;
    try {
      const offer = await db.Offer.findOne({ where: { id } });

      if (!offer) {
        return next(new HttpError(403, "Invalid Offer"));
      }

      const owner = await offer.getOwner();

      const user = await owner.getUser();

      return res.status(200).json(user);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 402,
          err.message
            ? err.message
            : "There was a problem querying the requested data."
        )
      );
    }
  },

  async approve(req, res, next) {
    const { id } = req.params;
    try {
      const offer = await db.Offer.findOne({ where: { id } });

      if (!offer) next(new HttpError(404, "Not Found"));

      const offerUpdated = await db.Offer.update(
        { status: "approved" },
        { where: { id } }
      );

      return res.status(200).json(offerUpdated);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 500,
          err.message ? err.message : "Server error."
        )
      );
    }
  },

  async reject(req, res, next) {
    const { id } = req.params;
    try {
      const offer = await db.Offer.findOne({ where: { id } });

      if (!offer) next(new HttpError(404, "Not Found"));

      const offerUpdated = await db.Offer.update(
        { status: "rejected" },
        { where: { id } }
      );

      return res.status(200).json(offerUpdated);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 500,
          err.message ? err.message : "Server error."
        )
      );
    }
  },

  async retry(req, res, next) {
    const { id } = req.params;
    try {
      const offer = await db.Offer.findOne({ where: { id } });

      if (!offer) next(new HttpError(404, "Not Found"));

      const offerUpdated = await db.Offer.update(
        { status: "pending" },
        { where: { id } }
      );

      return res.status(200).json(offerUpdated);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 500,
          err.message ? err.message : "Server error."
        )
      );
    }
  },

  async create(req, res, next) {
    const {
      price,
      title,
      offerType,
      propertyType,
      addressLocation,
      addressNumber,
      addressStreet,
      description,
      bedroomQuantity,
      bathroomQuantity,
      parkingSlotQuantity,
      area,
    } = req.body;

    const ownerUserId = req.user_id;

    try {
      const owner = await db.Owner.findOne({
        where: { user_id: ownerUserId },
      });

      if (!owner) throw new HttpError(403, "Owner not found");

      const offer = await db.Offer.create({
        id: UUIDV4(),
        price: price,
        title: title,
        offer_type: offerType,
        property_type: propertyType,
        address_location: addressLocation,
        address_number: addressNumber,
        address_street: addressStreet,
        status: "pending",
        owner_id: owner.id,
        description,
        bedroom_quantity: bedroomQuantity,
        bathroom_quantity: bathroomQuantity,
        parking_slot_quantity: parkingSlotQuantity,
        area,
      });

      return res.status(200).json(offer);
    } catch (err) {
      return next(
        new HttpError(
          err.statusCode ? err.statusCode : 402,
          err.message
            ? err.message
            : "There was a problem in creating the offer."
        )
      );
    }
  },
};
