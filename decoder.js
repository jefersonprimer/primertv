const fs = require('fs');

function decode() {
    const html = fs.readFileSync('/home/primer/.gemini/tmp/primertv/tool-outputs/session-73ad5b3e-0022-49e3-9917-1aa57bae693b/run_shell_command__run_shell_command_1781563270402_0.txt', 'utf8');
    
    // Look for the last occurrence of _865ebaa2f9( which is usually the call
    const startMarker = '_865ebaa2f9([';
    const startIndex = html.lastIndexOf(startMarker);
    if (startIndex === -1) {
        console.log("No call found");
        return;
    }
    
    // Extract everything from the call to the end
    let content = html.substring(startIndex + startMarker.length - 1);
    
    // Find the matching closing parenthesis
    let bracketCount = 0;
    let parenCount = 0;
    let inString = false;
    let escape = false;
    let callArgs = "";
    
    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"' || char === "'") {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '[') bracketCount++;
            else if (char === ']') bracketCount--;
            else if (char === '(') parenCount++;
            else if (char === ')') {
                parenCount--;
                if (parenCount === -1) {
                    callArgs = content.substring(0, i);
                    break;
                }
            }
        }
    }

    if (!callArgs) {
        console.log("Could not find end of call");
        return;
    }

    let arr1, arr2, keyBase64;
    try {
        const args = eval(`[${callArgs}]`);
        arr1 = args[0];
        arr2 = args[1];
        keyBase64 = args[2];
    } catch (e) {
        console.log("Error evaluating args: " + e.message);
        console.log("Call args start: " + callArgs.substring(0, 100));
        return;
    }

    const combinedBase64 = arr2.map(i => arr1[i]).join("");
    const decodedArr = Buffer.from(combinedBase64, 'base64');
    const key = Buffer.from(keyBase64, 'base64');
    
    const result = new Uint8Array(decodedArr.length);
    for (let i = 0; i < decodedArr.length; i++) {
        result[i] = decodedArr[i] ^ key[i % key.length];
    }
    
    const code = Buffer.from(result).toString('utf-8');
    console.log(code);
}

decode();
