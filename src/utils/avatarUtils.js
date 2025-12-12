export const getInitials = (name) => {
    if (!name) return "";

    // Handle Front Desk names like "FD - Hospital Name"
    let cleanName = name;
    if (name.startsWith("FD - ")) {
        cleanName = name.replace("FD - ", "");
    }

    const parts = cleanName.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
};

export const getColor = (name) => {
    if (!name) return "bg-gray-500";
    const colors = [
        "bg-red-500", "bg-green-500", "bg-blue-500", "bg-yellow-500",
        "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500", "bg-orange-500"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};
