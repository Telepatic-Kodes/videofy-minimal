from __future__ import annotations

import json
import logging

import anthropic

from .schemas import SummarizationResult

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model
        self._client = anthropic.Anthropic(api_key=api_key) if api_key else None

    def summarize_into_lines(
        self,
        text: str,
        title: str,
        system_prompt: str,
        model_override: str | None = None,
    ) -> list[str]:
        if not self._api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY is required to summarize article text "
                "when script_lines are not provided"
            )
        if self._client is None:
            raise ValueError("Anthropic client is not initialized")

        model = model_override or self._model
        logger.info(
            "[llm] Requesting script summary with model '%s' (title=%r, text_chars=%d)",
            model,
            title,
            len(text),
        )

        response = self._client.messages.create(
            model=model,
            max_tokens=400,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": json.dumps({"title": title, "text": text}),
                }
            ],
            tools=[
                {
                    "name": "output_lines",
                    "description": "Output the summarized script lines",
                    "input_schema": SummarizationResult.model_json_schema(),
                }
            ],
            tool_choice={"type": "tool", "name": "output_lines"},
        )

        tool_input: dict | None = None
        for block in response.content:
            if block.type == "tool_use" and block.name == "output_lines":
                tool_input = block.input  # type: ignore[union-attr]
                break

        if tool_input is None:
            raise ValueError("Claude summarization did not return a tool_use block")

        parsed = SummarizationResult.model_validate(tool_input)
        lines = [line.strip() for line in parsed.lines if line and line.strip()]
        if not lines:
            raise ValueError("Claude summarization produced no usable script lines")

        logger.info("[llm] Script summary completed (lines=%d)", len(lines))
        return lines
