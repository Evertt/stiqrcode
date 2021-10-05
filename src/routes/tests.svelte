<script lang="ts">
  import pako from "pako"
	import QRCode from 'qrcode'
  import state from '$lib/state'
	import { encode } from 'base45-ts/src/base45'
  import { formatDistanceToNow } from 'date-fns'

  let dataURL: string

  const compress = (jwt: string) => encode(pako.deflateRaw(jwt))

  $: tests = $state.tests.reverse().map(jws => {
    const payload = JSON.parse(atob(jws.split('.')[1]))
    const date = new Date(payload.dot.toString()
      .replace(/(\d\d)(\d\d)(\d\d)/, "20$1-$2-$3"))

    return { date: formatDistanceToNow(date, { addSuffix: true }), jws }
  })

  const makeQRCode = async (test: string) => {
    dataURL = "/tail-spin.svg"

		const resp = await fetch('/api/v1/sign', {
			headers: { 'Content-Type': 'text/plain' },
			method: 'POST', body: test,
		})

		const jws = await resp.text()
		const compressed = compress(jws)
		dataURL = await QRCode.toDataURL(compressed)
	}
</script>

{#each tests as { jws, date }}
  <button on:click={_ => makeQRCode(jws)}>{date}</button>
{/each}

{#if dataURL}
  <div class="qr-code" on:click={_ => dataURL = null}>
    <img src={dataURL} alt="QR Code" />
  </div>
{/if}

<style>
  button {
    width: 80vw;
    max-width: 250px;
    margin: 0 auto;
    padding: .25em;
  }

  .qr-code {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding: 0.5em;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5)
  }

  .qr-code img {
    width: 100%;
    max-width: 250px;
  }

  .qr-code img[src$="svg"] {
    max-width: 125px;
  }
</style>
