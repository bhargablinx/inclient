import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ServiceCatalog from "../models/serviceCatalog.model.js";
import { escapeRegex } from "../utils/escapeRegex.js";

const createService = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const { name, description, unitPrice, taxRate, unit } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "Service name is required");
    }

    if (unitPrice === undefined || unitPrice < 0) {
        throw new ApiError(400, "Unit price must be a positive number");
    }

    const allowedUnits = ["item", "hour", "day", "week", "month", "project"];

    if (unit && !allowedUnits.includes(unit)) {
        throw new ApiError(400, "Invalid unit");
    }

    const normalizedName = name.trim().toLowerCase();

    const existingService = await ServiceCatalog.findOne({
        organization: organizationId,
        name: {
            $regex: `^${escapeRegex(normalizedName)}$`,
            $options: "i",
        },
    });

    if (existingService) {
        throw new ApiError(409, "A service with this name already exists");
    }

    const service = await ServiceCatalog.create({
        organization: organizationId,
        name: name.trim(),
        description: description?.trim() || "",
        unitPrice,
        taxRate: taxRate || 0,
        unit: unit || "item",
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, service, "Service created successfully"));
});

const getServices = asyncHandler(async (req, res) => {
    const { organizationId } = req.params;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const { search, active } = req.query;

    const filter = {
        organization: organizationId,
    };

    if (search) {
        filter.name = {
            $regex: escapeRegex(search),
            $options: "i",
        };
    }

    if (active !== undefined) {
        filter.isActive = active === "true";
    }

    const [services, totalServices] = await Promise.all([
        ServiceCatalog.find(filter)
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        ServiceCatalog.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                services,
                pagination: {
                    page,
                    limit,
                    totalServices,
                    totalPages: Math.ceil(totalServices / limit),
                },
            },
            "Services fetched successfully"
        )
    );
});

const getService = asyncHandler(async (req, res) => {
    const { organizationId, serviceId } = req.params;

    const service = await ServiceCatalog.findOne({
        _id: serviceId,
        organization: organizationId,
    })
        .populate("createdBy", "name email")
        .lean();

    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, service, "Service fetched successfully"));
});

const updateService = asyncHandler(async (req, res) => {
    const { organizationId, serviceId } = req.params;

    const { name, description, unitPrice, taxRate, unit, isActive } = req.body;

    const service = await ServiceCatalog.findOne({
        _id: serviceId,
        organization: organizationId,
    });

    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    if (name !== undefined) {
        if (!name.trim()) {
            throw new ApiError(400, "Service name cannot be empty");
        }

        const existingService = await ServiceCatalog.findOne({
            organization: organizationId,
            _id: { $ne: serviceId },
            name: {
                $regex: `^${escapeRegex(name.trim())}$`,
                $options: "i",
            },
        });

        if (existingService) {
            throw new ApiError(409, "A service with this name already exists");
        }

        service.name = name.trim();
    }

    if (description !== undefined) {
        service.description = description.trim();
    }

    if (unitPrice !== undefined) {
        if (unitPrice < 0) {
            throw new ApiError(400, "Unit price cannot be negative");
        }

        service.unitPrice = unitPrice;
    }

    if (taxRate !== undefined) {
        if (taxRate < 0) {
            throw new ApiError(400, "Tax rate cannot be negative");
        }

        service.taxRate = taxRate;
    }

    if (unit !== undefined) {
        const allowedUnits = [
            "item",
            "hour",
            "day",
            "week",
            "month",
            "project",
        ];

        if (!allowedUnits.includes(unit)) {
            throw new ApiError(400, "Invalid unit");
        }

        service.unit = unit;
    }

    if (isActive !== undefined) {
        service.isActive = isActive;
    }

    await service.save();

    return res
        .status(200)
        .json(new ApiResponse(200, service, "Service updated successfully"));
});

const deleteService = asyncHandler(async (req, res) => {
    const { organizationId, serviceId } = req.params;

    const service = await ServiceCatalog.findOne({
        _id: serviceId,
        organization: organizationId,
    });

    if (!service) {
        throw new ApiError(404, "Service not found");
    }

    if (!service.isActive) {
        throw new ApiError(400, "Service is already inactive");
    }

    service.isActive = false;

    await service.save();

    return res
        .status(200)
        .json(new ApiResponse(200, null, "Service deleted successfully"));
});

export { createService, getServices, getService, updateService, deleteService };
