import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Link, Navigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Loading from "@/components/Loading";
import { getMembers } from "@/api/organization.api";
import { getInitials } from "@/lib/helper";

const badgeVariant = (role) => {
    switch (role) {
        case "owner":
            return "default";
        case "admin":
            return "secondary";
        default:
            return "outline";
    }
};

const ViewMembers = () => {
    const { activeOrganization, loading: orgLoading } = useSelector(
        (state) => state.organization,
    );
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchMembers = async () => {
            if (!activeOrganization?._id) return;

            try {
                setLoading(true);
                setError("");
                const res = await getMembers(activeOrganization._id);
                setMembers(res.data.data ?? []);
            } catch (err) {
                setError(
                    err.response?.data?.message ?? "Failed to load members",
                );
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [activeOrganization?._id]);

    const stats = useMemo(() => {
        const activeMembers = members.filter(
            (member) => member.status === "active",
        );

        return {
            total: activeMembers.length,
            owners: activeMembers.filter((member) => member.role === "owner")
                .length,
            admins: activeMembers.filter((member) => member.role === "admin")
                .length,
            pendingInvites: members.filter(
                (member) => member.status === "invited",
            ).length,
        };
    }, [members]);

    if (orgLoading || loading) return <Loading />;

    if (!activeOrganization) {
        return <Navigate to="/organizations/new" replace />;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Members</h1>

                <p className="text-muted-foreground">
                    Browse everyone who belongs to{" "}
                    <span className="font-medium text-foreground">
                        {activeOrganization.name}
                    </span>
                    .
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Members</CardTitle>

                    <CardDescription>
                        {stats.total} active members
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {error ? (
                        <div className="rounded-lg border border-dashed p-6 text-sm text-destructive">
                            {error}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {members
                                    .filter(
                                        (member) => member.status === "active",
                                    )
                                    .map((member) => (
                                        <TableRow key={member._id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarFallback>
                                                            {member.user?.name
                                                                ? getInitials(
                                                                      member.user
                                                                          .name,
                                                                  )
                                                                : "U"}
                                                        </AvatarFallback>
                                                    </Avatar>

                                                    <div>
                                                        <p className="font-medium">
                                                            {member.user?.name}
                                                        </p>

                                                        <p className="text-sm text-muted-foreground">
                                                            Team Member
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell>
                                                {member.user?.email}
                                            </TableCell>

                                            <TableCell>
                                                <Badge
                                                    variant={badgeVariant(
                                                        member.role,
                                                    )}
                                                >
                                                    {member.role}
                                                </Badge>
                                            </TableCell>

                                            <TableCell>
                                                {new Date(
                                                    member.joinedAt ??
                                                        member.createdAt,
                                                ).toLocaleDateString("en-US", {
                                                    day: "2-digit",
                                                    month: "short",
                                                    year: "numeric",
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ViewMembers;
