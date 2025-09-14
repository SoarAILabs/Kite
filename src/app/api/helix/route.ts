import HelixDB from "helix-ts";

// Create a new HelixDB client 
const client = new HelixDB("https://localhost:6969");

await client.query("adduser", {
    name: "John Doe",
    age:20
})


// Get the user
const user = await client.query("getUser", {
    name: "John"
});

console.log(user);