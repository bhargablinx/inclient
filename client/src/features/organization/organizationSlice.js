import { createSlice } from "@reduxjs/toolkit";
import {
    createOrganization,
    getOrganization,
    getMyOrganizations,
    updateOrganization,
    deleteOrganization,
    getOrganizationInvitations,
} from "./organizationThunk";

const initialState = {
    organization: null,
    organizations: [],
    activeOrganization: null, // The currently selected org in the sidebar switcher
    invitations: [],
    loading: false,
    error: null,
};

const pending = (state) => {
    state.loading = true;
    state.error = null;
};

const rejected = (state, action) => {
    state.loading = false;
    state.error = action.payload?.message;
};

export const organizationSlice = createSlice({
    name: "organization",
    initialState,
    reducers: {
        clearOrganizationState: () => initialState,
        // Dispatched by OrganizationSwitcher when the user picks a different org.
        // Every page's useEffect([..., activeOrganization?._id]) reacts and re-fetches.
        setActiveOrganization: (state, action) => {
            state.activeOrganization = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(createOrganization.pending, pending)
            .addCase(createOrganization.fulfilled, (state, action) => {
                state.loading = false;
                state.organization = action.payload;
                state.organizations = [action.payload, ...state.organizations];
                // Auto-switch to the newly created org
                state.activeOrganization = action.payload;
            })
            .addCase(createOrganization.rejected, rejected)
            .addCase(getOrganization.pending, pending)
            .addCase(getOrganization.fulfilled, (state, action) => {
                state.loading = false;
                state.organization = action.payload;
            })
            .addCase(getOrganization.rejected, rejected)
            .addCase(getMyOrganizations.pending, pending)
            .addCase(getMyOrganizations.fulfilled, (state, action) => {
                state.loading = false;
                state.organizations = action.payload ?? [];
                // Only set the default on first load; don't override an already-picked org
                if (!state.activeOrganization) {
                    state.activeOrganization = action.payload?.[0] ?? null;
                }
                state.organization = action.payload?.[0] ?? null;
            })
            .addCase(getMyOrganizations.rejected, rejected)
            .addCase(updateOrganization.pending, pending)
            .addCase(updateOrganization.fulfilled, (state, action) => {
                state.loading = false;
                state.organization = action.payload;
                // Sync the activeOrganization if the updated org is the current one
                if (state.activeOrganization?._id === action.payload?._id) {
                    state.activeOrganization = action.payload;
                }
            })
            .addCase(updateOrganization.rejected, rejected)
            .addCase(deleteOrganization.pending, pending)
            .addCase(deleteOrganization.fulfilled, (state) => {
                state.loading = false;
                state.organization = null;
                state.activeOrganization = null;
            })
            .addCase(deleteOrganization.rejected, rejected)
            .addCase(getOrganizationInvitations.fulfilled, (state, action) => {
                state.invitations = action.payload ?? [];
            });
    },
});

export const { clearOrganizationState, setActiveOrganization } =
    organizationSlice.actions;

export default organizationSlice.reducer;

