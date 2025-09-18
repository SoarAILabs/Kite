class GithubAgent {
  async processRequest(request: string) {
    const response = await fetch("/api/github", {
      method: "POST",
      body: request,
    });
    return response.json();
  }
}
