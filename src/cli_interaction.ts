import readline from "readline";


const onUserResponse = async (rl: readline.Interface, ragChain: any, question: string) => {
    if (question.toLowerCase() === "exit" || question.toLowerCase() === "quit") {
        console.log("👋 Bis bald!");
        rl.close();
        return;
    }

    console.log("\n🤖 Denke nach...");

    try {
        const response = await ragChain.invoke({ input: question });

        console.log("\n================ ANTWORT ================");
        console.log(response.answer);
        console.log("=========================================\n");

    } catch (error) {
        console.error("❌ Fehler:", error);
    }

    sendReadyMessageToUser(rl, ragChain);
}

export const sendReadyMessageToUser = (rl: readline.Interface, ragChain: any) => {
    rl.question("🧑‍🎓 Deine Frage an BHH-Insight (oder 'exit' zum Beenden): ",
        onUserResponse.bind(null, rl, ragChain)
    );
};