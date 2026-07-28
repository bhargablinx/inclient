"use client";

import * as React from "react";

import { NavMain } from "@/components/NavMain";
import { NavUser } from "@/components/NavUser";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    Building2,
    Users,
    UsersRound,
    CircleDollarSign,
    HandPlatter,
    BarChart3,
    Settings,
    Receipt,
} from "lucide-react";
import { useSelector } from "react-redux";

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: <LayoutDashboard />,
            isActive: true,
            hasChild: false,
        },

        {
            title: "Organizations",
            url: "/organizations",
            icon: <Building2 />,
            items: [
                {
                    title: "My Organizations",
                    url: "/organizations",
                },
                {
                    title: "Invitations",
                    url: "/organizations/invitations",
                },
            ],
            hasChild: true,
        },

        {
            title: "Members",
            url: "/members",
            icon: <Users />,
            items: [
                {
                    title: "View Members",
                    url: "/members",
                },
                {
                    title: "Manage Members",
                    url: "/members/manage",
                },
            ],
            hasChild: true,
        },

        {
            title: "Clients",
            url: "/clients",
            icon: <UsersRound />,
            items: [
                {
                    title: "All Clients",
                    url: "/clients",
                },
                {
                    title: "Manage Clients",
                    url: "/clients/manage",
                },
            ],
            hasChild: true,
        },

        {
            title: "Invoices",
            url: "/invoices",
            icon: <Receipt />,
            items: [
                {
                    title: "Invoices Dashboard",
                    url: "/invoices",
                },
                {
                    title: "Manage Invoices",
                    url: "/invoices/manage",
                },
            ],
            hasChild: true,
        },

        {
            title: "Payments",
            url: "/payments",
            icon: <CircleDollarSign />,
            hasChild: false,
        },

        // {
        //     title: "Services",
        //     url: "/services",
        //     icon: <HandPlatter />,
        //     hasChild: false,
        // },

        // {
        //     title: "Reports",
        //     url: "/reports",
        //     icon: <BarChart3 />,
        //     items: [
        //         {
        //             title: "Revenue Report",
        //             url: "/reports/revenue",
        //         },
        //         {
        //             title: "Invoice Report",
        //             url: "/reports/invoices",
        //         },
        //         {
        //             title: "Client Report",
        //             url: "/reports/clients",
        //         },
        //     ],
        //     hasChild: true,
        // },

        // {
        //     title: "Settings",
        //     url: "/settings",
        //     icon: <Settings />,
        //     hasChild: false,
        // },
    ],
};

export function AppSidebar({ ...props }) {
    const organizations = useSelector(
        (state) => state.organization.organizations,
    );

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <OrganizationSwitcher organizations={organizations} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
