import { Clipboard, getPreferenceValues, LaunchProps, showToast, Toast } from "@raycast/api";
import fetch from "node-fetch";

interface Arguments {
  url: string;
}

interface Preferences {
  apikey: string;
}

interface WhereGoesResponse {
  success: boolean,
  data: {
    id: string,
    type: string,
    url: string,
    visibility: string,
    options: unknown[],
    createdAt: string,
    responses: {
      request_url: string,
      code: string,
      redirect_method: string
    }[],
    message: string
  }
}

function showSuccess(toast: Toast, resolvedUri: { request_url: string; code: string; redirect_method: string }) {
  toast.style = Toast.Style.Success;
  toast.title = "Resolved Uri";
  toast.message = resolvedUri.request_url;
}

function showError(toast: Toast) {
  toast.style = Toast.Style.Failure;
  toast.title = "Failed to resolve URI";
}

export default async function Command(props: LaunchProps<{ arguments: Arguments }>) {
  const toast = await showToast({
    style: Toast.Style.Animated,
    title: "Resolving URI"
  });
  const { apikey } = getPreferenceValues<Preferences>();
  await fetch("https://api.wheregoes.dev/api/v1/traces", {
    method: "POST",
    body: JSON.stringify({
      "url": `${props.arguments.url}`,
      "type": "redirects"
    }),
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apikey}`
    }
  }).then(async (res) => {
    try {
      const json: WhereGoesResponse = await res.json() as WhereGoesResponse;
      if (!json.success) return Promise.reject();

      const resolvedUri = json.data.responses.find(res => res.redirect_method == null);
      if (!resolvedUri) return Promise.reject();

      showSuccess(toast, resolvedUri);
      await Clipboard.copy(resolvedUri.request_url);
    } catch (e) {
      return Promise.reject(e);
    }
  }).catch(() => {
    showError(toast);
  });
}
